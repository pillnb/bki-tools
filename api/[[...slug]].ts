/**
 * Vercel Functions Handler - Main Entry Point
 * 
 * Tangkap semua request ke /api/* dan route ke Express handler
 */

import "dotenv/config";
import type { Request, Response } from "express";
import { getDbConnection } from "../server/_core/db-connection";

// Initialize DB connection on startup
getDbConnection().catch((error) => {
  console.error("[API Init] Failed to initialize database:", error);
});

// Import handler
import handler from "../server/_core/vercel-handler";

/**
 * Vercel Function Handler - catches /api/* routes
 */
export default async function apiHandler(req: Request, res: Response) {
  // Log incoming request
  console.log(`[API] ${req.method} ${req.url}`);

  try {
    // Delegate ke Express handler
    return await handler(req, res);
  } catch (error) {
    console.error("[Handler Error]", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }
}
