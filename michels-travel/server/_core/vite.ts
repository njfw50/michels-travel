import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes - let them be handled by Express API middleware
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return next();
    }

    try {
      // Resolve path relative to the michels-travel directory
      // Try multiple strategies to find client/index.html
      const possiblePaths = [
        // Strategy 1: Relative to server/_core (normal case)
        path.resolve(import.meta.dirname, "../..", "client", "index.html"),
        // Strategy 2: From current working directory
        path.resolve(process.cwd(), "client", "index.html"),
        // Strategy 3: From CWD + michels-travel (if run from parent directory)
        path.resolve(process.cwd(), "michels-travel", "client", "index.html"),
        // Strategy 4: Direct relative path
        path.resolve(import.meta.dirname, "../../client/index.html"),
      ];
      
      let clientTemplate: string | null = null;
      let projectRoot: string | null = null;
      
      // Find the first path that exists
      for (const candidatePath of possiblePaths) {
        if (fs.existsSync(candidatePath)) {
          clientTemplate = candidatePath;
          // Extract project root from the found path
          projectRoot = path.dirname(path.dirname(candidatePath));
          break;
        }
      }
      
      // Debug: log the paths being used (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log(`[Vite] import.meta.dirname: ${import.meta.dirname}`);
        console.log(`[Vite] CWD: ${process.cwd()}`);
        console.log(`[Vite] Tried paths:`, possiblePaths);
        if (clientTemplate) {
          console.log(`[Vite] ✅ Found index.html at: ${clientTemplate}`);
          console.log(`[Vite] Project root: ${projectRoot}`);
        }
      }
      
      // Verify file exists after all attempts - if not, return a friendly error page
      if (!clientTemplate || !fs.existsSync(clientTemplate)) {
        console.error(`[Vite] ERROR: index.html not found after trying all paths`);
        console.error(`[Vite] Current working directory: ${process.cwd()}`);
        console.error(`[Vite] import.meta.dirname: ${import.meta.dirname}`);
        console.error(`[Vite] Tried paths:`, possiblePaths);
        
        // Return a friendly HTML error page instead of JSON for non-API routes
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Client Files Not Found</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                h1 { color: #e11d48; }
                code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
                pre { background: #f3f4f6; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
              </style>
            </head>
            <body>
              <h1>Client Files Not Found</h1>
              <p>Make sure you're running <code>pnpm dev</code> from the <code>michels-travel</code> directory.</p>
              <p><strong>Current working directory:</strong></p>
              <pre>${process.cwd()}</pre>
              <p><strong>Tried paths:</strong></p>
              <pre>${possiblePaths.map(p => `- ${p}`).join('\n')}</pre>
              <hr>
              <p><small>API endpoints are available at <code>/api/trpc</code></small></p>
            </body>
          </html>
        `);
      }

      // Always reload the index.html file from disk in case it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      // Log error but don't expose stack trace to client
      console.error("[Vite] Error serving SPA:", e);
      vite.ssrFixStacktrace(e as Error);
      
      // Return a safe error response
      if (req.path.startsWith("/api/")) {
        // API routes get JSON
        return res.status(500).json({
          error: true,
          code: "INTERNAL_SERVER_ERROR",
          message: "Error serving frontend",
        });
      } else {
        // Non-API routes get HTML
        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Server Error</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                h1 { color: #e11d48; }
              </style>
            </head>
            <body>
              <h1>Server Error</h1>
              <p>An error occurred while serving the frontend. Please check the server logs.</p>
              <hr>
              <p><small>API endpoints are available at <code>/api/trpc</code></small></p>
            </body>
          </html>
        `);
      }
    }
  });
}

/**
 * Serve static files from build output (PRODUCTION ONLY)
 * 
 * DOGMA 2: No silent failures
 * - Checks file existence before serving
 * - Returns canonical errors for API routes
 * - Returns friendly HTML for non-API routes
 * 
 * This function should ONLY be called in production mode.
 * In development, use setupVite() instead.
 */
export function serveStatic(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  
  // In development, this should not be called, but if it is, log a warning
  if (!isProduction) {
    console.warn(
      "[Static] serveStatic() called in development mode. " +
      "This is unexpected - development should use setupVite() instead."
    );
    // In development, don't try to serve static files
    // Just provide a helpful message at root
    app.use("*", (req, res, next) => {
      // API routes should work normally
      if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
        return next();
      }
      // Non-API routes get a helpful message
      if (req.path === "/" || req.path === "") {
        return res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Backend API Server</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                h1 { color: #2563eb; }
                code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
              </style>
            </head>
            <body>
              <h1>Backend API Server Running</h1>
              <p>This is the backend API server. The frontend should be served by Vite dev server.</p>
              <p><strong>API endpoints:</strong></p>
              <ul>
                <li><code>/api/trpc</code> - tRPC API</li>
                <li><code>/api/oauth/callback</code> - OAuth callback</li>
                <li><code>/api/webhooks/square</code> - Square webhooks</li>
              </ul>
              <hr>
              <p><small>If you're seeing this in production, make sure to run <code>pnpm build</code> first.</small></p>
            </body>
          </html>
        `);
      }
      return next();
    });
    return;
  }

  // PRODUCTION MODE: Serve from dist/public (build output)
  const distPath = path.resolve(import.meta.dirname, "../..", "dist", "public");
  const indexPath = path.resolve(distPath, "index.html");

  // Check if build directory exists
  if (!fs.existsSync(distPath)) {
    console.error(
      `[Static] CRITICAL: Build directory not found: ${distPath}. ` +
      `Cannot serve frontend in production. Run 'pnpm build' to build the client.`
    );
    // In production, return a helpful error page instead of crashing
    app.use("*", (req, res) => {
      // API routes should still return JSON
      if (req.path.startsWith("/api/")) {
        return res.status(503).json({
          error: true,
          code: "SERVICE_UNAVAILABLE",
          message: "Frontend build not found. Please run 'pnpm build' to build the client.",
        });
      }
      // Non-API routes get a simple HTML error page
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Build Required</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              h1 { color: #e11d48; }
              code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <h1>Frontend Build Not Found</h1>
            <p>The frontend has not been built yet. Please run:</p>
            <p><code>pnpm build</code></p>
            <p>Then restart the server.</p>
            <hr>
            <p><small>API endpoints are available at <code>/api/trpc</code></small></p>
          </body>
        </html>
      `);
    });
    return;
  }

  // Serve static files from dist/public
  app.use(express.static(distPath));

  // Fall through to index.html for SPA routes (only if it exists)
  app.use("*", (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
      return next();
    }

    // Only serve index.html if it exists
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("[Static] Error serving index.html:", err);
          // DOGMA 1: API routes return JSON only
          if (req.path.startsWith("/api/")) {
            return res.status(500).json({
              error: true,
              code: "INTERNAL_SERVER_ERROR",
              message: "Error serving frontend",
            });
          }
          // Non-API routes get HTML
          res.status(500).send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Server Error</title>
                <style>
                  body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
                  h1 { color: #e11d48; }
                </style>
              </head>
              <body>
                <h1>Server Error</h1>
                <p>An error occurred while serving the frontend. Please check the server logs.</p>
                <hr>
                <p><small>API endpoints are available at <code>/api/trpc</code></small></p>
              </body>
            </html>
          `);
        }
      });
    } else {
      // If index.html doesn't exist, return 404
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({
          error: true,
          code: "NOT_FOUND",
          message: "Frontend index.html not found in build directory",
          details: { expectedPath: indexPath },
        });
      }
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Not Found</title>
            <style>
              body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              h1 { color: #e11d48; }
            </style>
          </head>
          <body>
            <h1>Frontend Not Found</h1>
            <p>The frontend index.html file was not found in the build directory.</p>
            <hr>
            <p><small>API endpoints are available at <code>/api/trpc</code></small></p>
          </body>
        </html>
      `);
    }
  });
}
