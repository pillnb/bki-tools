import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { randomUUID } from 'crypto';

export function registerMockLoginRoutes(app: Express) {
  app.get("/api/mock-login", async (req: Request, res: Response) => {
    try {
      // Generate a random user ID
      const openId = `user-${randomUUID()}`;
      
      // Create default user in database
      await db.upsertUser({
        openId,
        name: "BKI User",
        email: "user@bki.co.id",
        role: "admin", // atau sesuaikan dengan role default yang diinginkan
        loginMethod: "none",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: "BKI User",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to dashboard
      res.redirect(302, "/dashboard");
    } catch (error) {
      console.error("[Mock Login] Failed:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
}