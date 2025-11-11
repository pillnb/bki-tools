/**
 * Vercel Functions Entry Point
 * 
 * File ini menjadi handler untuk semua request ke `/api/*`
 * 
 * Setup:
 * 1. Copy file ini ke `api/index.ts` di root project
 * 2. Pastikan `server/` folder tersedia (sibling dengan `client/`)
 * 3. Set DATABASE_URL di Vercel environment variables
 * 4. Deploy
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
 * Default export untuk Vercel Functions
 */
export default async function apiHandler(req: Request, res: Response) {
  // Log incoming request (development only)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[API] ${req.method} ${req.url}`);
  }

  try {
    // Delegate ke Express handler
    return await handler(req, res);
  } catch (error) {
    console.error("[API Handler Error]", error);
    res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
}
