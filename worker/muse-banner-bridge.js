// Muse -> Michel's Travel: isolated banner-image bridge (not a public visitor endpoint).
// Deploy as a SEPARATE Cloudflare Worker. Never put secrets in GitHub or client JS.
// Bind BANNER_JOBS (KV), BANNER_IMAGES (private R2) and configure the secrets
// OPENAI_API_KEY, MUSE_BANNER_TOKEN and OWNER_BANNER_TOKEN.
// Draft background images are NOT approved marketing materials: Muse must add the
// original logo and exact copy in a separate, deterministic composition step.

const TTL_SECONDS = 7 * 24 * 60 * 60;
const MODEL = "gpt-image-2"; // supported flexible sizes, incl. 1088x1360
const FORMATS = { portrait: "1088x1360", square: "1024x1024", story: "1024x1536" };

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function authenticated(request, secret) {
  return typeof secret === "string" && secret.length >= 24 &&
    request.headers.get("authorization") === `Bearer ${secret}`;
}

function requiredBindings(env) {
  return !!(env.OPENAI_API_KEY && env.MUSE_BANNER_TOKEN &&
    env.OWNER_BANNER_TOKEN && env.BANNER_JOBS && env.BANNER_IMAGES);
}

async function readJob(env, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const raw = await env.BANNER_JOBS.get(`banner:${id}`);
  return raw ? JSON.parse(raw) : null;
}

async function writeJob(env, job) {
  await env.BANNER_JOBS.put(`banner:${job.id}`, JSON.stringify(job), {
    expirationTtl: TTL_SECONDS,
  });
}

function publicJob(job) {
  return {
    id: job.id, status: job.status, created_at: job.created_at,
    format: job.format, title: job.title, error: job.error || null,
    image_path: job.object_key ? `/api/banner/jobs/${job.id}/image` : null,
    // No public image URL: the R2 asset is private and requires a bearer token.
  };
}

function promptFor(job) {
  return [
    "Create a premium photorealistic travel-advertising BACKGROUND photograph,",
    "suitable for a professional agency social-media banner.",
    `Destination: ${job.destination}.`,
    `Creative direction: ${job.brief}.`,
    "Aspirational, cinematic, high-detail editorial photography, authentic place,",
    "natural human proportions, excellent light, compelling composition.",
    "Leave a generous quiet dark area for later white headline and coral CTA overlays.",
    "Do NOT include ANY words, typography, lettering, logos, watermarks, badges or CTAs.",
    "The official agency logo and exact factual offer will be added later by Muse.",
  ].join(" ");
}

async function generate(env, job) {
  try {
    job.status = "generating";
    await writeJob(env, job);

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: promptFor(job),
        size: FORMATS[job.format],
        quality: "medium",
        output_format: "png",
        n: 1,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI image API status ${response.status}`);
    const data = await response.json();
    const base64 = data?.data?.[0]?.b64_json;
    if (typeof base64 !== "string" || !base64.length) throw new Error("No image returned");
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const objectKey = `banner-drafts/${job.id}.png`;
    await env.BANNER_IMAGES.put(objectKey, bytes, {
      httpMetadata: { contentType: "image/png" },
    });

    job.status = "review";
    job.object_key = objectKey;
    job.completed_at = new Date().toISOString();
    await writeJob(env, job);
  } catch (error) {
    console.error("Muse banner generation failed:", String(error));
    job.status = "failed";
    job.error = "generation_failed";
    await writeJob(env, job);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/health" && request.method === "GET") {
      return reply({ service: "muse-banner-bridge", configured: requiredBindings(env) });
    }
    if (!requiredBindings(env)) return reply({ error: "not_configured" }, 503);

    const owner = authenticated(request, env.OWNER_BANNER_TOKEN);
    const muse = authenticated(request, env.MUSE_BANNER_TOKEN);
    if (!owner && !muse) return reply({ error: "unauthorized" }, 401);

    if (path === "/api/banner/jobs" && request.method === "POST") {
      if (!muse) return reply({ error: "forbidden" }, 403);
      const raw = await request.text();
      if (raw.length > 4000) return reply({ error: "brief_too_long" }, 413);
      let data;
      try { data = JSON.parse(raw); } catch { return reply({ error: "invalid_json" }, 400); }
      const destination = String(data?.destination || "").trim().slice(0, 120);
      const brief = String(data?.brief || "").trim().slice(0, 1000);
      const title = String(data?.title || "").trim().slice(0, 100);
      const format = String(data?.format || "portrait");
      if (!destination || !brief || !FORMATS[format]) {
        return reply({ error: "destination_brief_format_required" }, 400);
      }
      // Best-effort daily cap; Cloudflare KV increments are not atomic.
      // Enforce a REAL billing/spend cap and abuse prevention at the account/edge.
      const day = new Date().toISOString().slice(0, 10);
      const counterKey = `count:${day}`;
      const count = Number(await env.BANNER_JOBS.get(counterKey) || 0);
      if (count >= 3) return reply({ error: "daily_limit_reached" }, 429);
      await env.BANNER_JOBS.put(counterKey, String(count + 1), { expirationTtl: 172800 });

      const job = {
        id: crypto.randomUUID(), title, destination, brief, format,
        status: "queued", created_at: new Date().toISOString(),
      };
      await writeJob(env, job);
      ctx.waitUntil(generate(env, job));
      return reply(publicJob(job), 202);
    }

    const match = path.match(/^\/api\/banner\/jobs\/([0-9a-f-]{36})(?:\/(image|approve|reject))?$/i);
    if (!match) return reply({ error: "not_found" }, 404);
    const [, id, action] = match;
    const job = await readJob(env, id);
    if (!job) return reply({ error: "not_found" }, 404);

    if (!action && request.method === "GET") return reply(publicJob(job));

    if (action === "image" && request.method === "GET") {
      if (!job.object_key) return reply({ error: "image_not_ready" }, 409);
      const object = await env.BANNER_IMAGES.get(job.object_key);
      if (!object) return reply({ error: "image_not_found" }, 404);
      return new Response(object.body, {
        headers: { "content-type": "image/png", "cache-control": "private, no-store" },
      });
    }

    // Approval only marks a draft ready for Muse's subsequent composition.
    // This worker NEVER posts publicly or sends customer messages.
    if ((action === "approve" || action === "reject") && request.method === "POST") {
      if (!owner) return reply({ error: "owner_approval_required" }, 403);
      if (job.status !== "review") return reply({ error: "not_reviewable" }, 409);
      job.status = action === "approve" ? "approved" : "rejected";
      job.reviewed_at = new Date().toISOString();
      await writeJob(env, job);
      return reply(publicJob(job));
    }

    return reply({ error: "method_not_allowed" }, 405);
  },
};
