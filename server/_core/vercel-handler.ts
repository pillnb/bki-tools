/**
 * Express handler untuk Vercel Functions
 * Berjalan di /api/[[...slug]].ts tanpa app.listen()
 * 
 * Menangani:
 * - /api/trpc - tRPC endpoints
 * - /api/oauth/callback - OAuth routes
 * - /api/health - Health check
 */

import type { Request, Response } from "express";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";

// Inisialisasi Express app sekali saja (di-cache oleh Vercel)
const app = express();

// Middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS middleware untuk development dan production
app.use((req: Request, res: Response, next: express.NextFunction) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

// Health check endpoint
app.get("/health", async (req: Request, res: Response) => {
  const { isDbHealthy } = await import("./db-connection");
  try {
    const healthy = await isDbHealthy();
    res.status(healthy ? 200 : 503).json({
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

// tRPC routes
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// OAuth routes
registerOAuthRoutes(app);

// 404 handler
app.use((req: Request, res: Response) => {
  console.warn(`[404] ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    console.error("[Express Error]", err);
    if (!res.headersSent) {
      res.status(500).json({
        error: process.env.NODE_ENV === "production" ? "Internal error" : err.message,
      });
    }
  }
);

/**
 * Vercel Functions Handler
 * Semua request HTTP masuk melalui sini
 */
export default async function handler(
  req: Request,
  res: Response
): Promise<void> {
  return new Promise<void>((resolve) => {
    app(req, res, (err?: any) => {
      if (err) {
        console.error("[Handler Error]", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal error" });
        }
      }
      resolve();
    });
  });
}
