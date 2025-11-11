/**
 * Express handler untuk Vercel Functions
 * Berjalan di /api/[[...slugs]].ts tanpa app.listen()
 * 
 * Cara menggunakan:
 * 1. Copy file ini ke api/[[...slugs]].ts di project Anda
 * 2. Setup DATABASE_URL di Vercel environment variables
 * 3. Deploy ke Vercel
 * 
 * File akan menangani:
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
import { getDbConnection, isDbHealthy } from "./db-connection";

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
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    const isHealthy = await isDbHealthy();
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "unhealthy",
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

// Initialize DB connection pada startup
getDbConnection().catch(console.error);

// tRPC routes
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// OAuth routes
registerOAuthRoutes(app);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use(
  (
    err: any,
    req: Request,
    res: Response,
    next: express.NextFunction
  ) => {
    console.error("[API Error]", err);
    res.status(500).json({
      error: process.env.NODE_ENV === "production" ? "Internal error" : err.message,
    });
  }
);

/**
 * Vercel Functions / Node.js handler
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
