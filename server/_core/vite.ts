import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  console.log("[Vite] Setting up Vite dev server...");
  console.log("[Vite] NODE_ENV:", process.env.NODE_ENV);
  console.log("[Vite] process.cwd():", process.cwd());
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  let vite;
  try {
    vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      server: serverOptions,
      appType: "custom",
    });
    console.log("[Vite] Vite server created successfully");
  } catch (error) {
    console.error("[Vite] Failed to create Vite server:", error);
    throw error;
  }

  app.use(vite.middlewares);
  console.log("[Vite] Vite middlewares registered");
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return next();
    }

    try {
      // Try multiple paths to find index.html
      const possiblePaths = [
        path.resolve(import.meta.dirname, "../..", "client", "index.html"),
        path.resolve(process.cwd(), "client", "index.html"),
        path.resolve(import.meta.dirname, "../..", "michels-travel", "client", "index.html"),
        path.resolve(process.cwd(), "michels-travel", "client", "index.html"),
      ];
      
      let clientTemplate: string | null = null;
      for (const candidatePath of possiblePaths) {
        if (fs.existsSync(candidatePath)) {
          clientTemplate = candidatePath;
          console.log(`[Vite] ✅ Found index.html at: ${clientTemplate}`);
          break;
        }
      }
      
      if (!clientTemplate) {
        console.error(`[Vite] ❌ index.html not found. Tried:`);
        possiblePaths.forEach(p => console.error(`  - ${p}`));
        return res.status(404).json({ 
          error: "Client files not found. Make sure to run 'pnpm dev' from michels-travel directory.",
          triedPaths: possiblePaths
        });
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
