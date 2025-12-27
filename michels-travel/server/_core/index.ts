import "dotenv/config";
// Set NODE_ENV to development if not already set (for Windows compatibility)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Square webhook endpoint (for payment notifications)
  app.post(
    "/api/webhooks/square",
    express.json(),
    async (req, res) => {
      try {
        const event = req.body;
        console.log("[Square Webhook] Received event:", event.type);
        
        // Handle different event types
        if (event.type === "payment.completed" || event.type === "order.updated") {
          // Payment completed - order status will be checked via verifyPayment endpoint
          console.log("[Square Webhook] Payment/Order event processed");
        }
        
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("[Square Webhook] Error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    try {
      await setupVite(app, server);
      console.log("[Server] Vite dev server configured successfully");
    } catch (error) {
      console.error("[Server] Failed to setup Vite:", error);
      console.error("[Server] Falling back to serveStatic (this should not happen in development)");
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
