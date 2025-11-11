/**
 * Vercel Functions - Root API Handler
 * 
 * Handles requests to /api and /api/
 */

import "dotenv/config";
import type { Request, Response } from "express";
import { getDbConnection, isDbHealthy } from "../server/_core/db-connection";

// Initialize DB connection
getDbConnection().catch((error) => {
  console.error("[API Init] Failed to initialize database:", error);
});

/**
 * Root API handler - Simple health check at /api
 */
export default async function apiRootHandler(req: Request, res: Response) {
  console.log(`[API Root] ${req.method} ${req.url}`);

  try {
    if (req.url === "/" || req.url === "") {
      // Health check at /api
      const isHealthy = await isDbHealthy();
      return res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? "healthy" : "unhealthy",
        message: "API Root - Health Check",
        timestamp: new Date().toISOString(),
      });
    }

    // All other requests should go through [[...slug]].ts
    res.status(404).json({
      error: "Not found",
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API Root Error]", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}
