import { ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";

// Mock OAuth for development
export function registerMockOAuthRoutes(app: Express) {
  // Mock OAuth login page
  app.get("/app-auth", (req, res) => {
    const { appId, redirectUri, state, type } = req.query;
    
    // Simple login form
    res.send(`
      <html>
        <body>
          <h1>Development Login</h1>
          <form action="/mock-oauth/login" method="POST">
            <input type="hidden" name="redirectUri" value="${redirectUri}">
            <input type="hidden" name="state" value="${state}">
            <div>
              <label>Name:</label>
              <input type="text" name="name" value="Admin User">
            </div>
            <div>
              <label>Email:</label>
              <input type="email" name="email" value="admin@local.dev">
            </div>
            <div>
              <label>Role:</label>
              <select name="role">
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="lab_supervisor">Lab Supervisor</option>
                <option value="coordinator">Coordinator</option>
                <option value="sm_operasi">SM Operasi</option>
              </select>
            </div>
            <button type="submit">Login</button>
          </form>
        </body>
      </html>
    `);
  });

  // Handle mock login
  app.post("/mock-oauth/login", async (req, res) => {
    const { redirectUri, state, name, email, role } = req.body;
    
    // Create mock user
    const openId = `dev-${Date.now()}`;
    await db.upsertUser({
      openId,
      name: name || "Dev User",
      email: email || "dev@local.dev",
      role: role || "admin",
      loginMethod: "development",
      lastSignedIn: new Date()
    });

    // Redirect back with mock code
    const code = Buffer.from(JSON.stringify({ openId, name, email })).toString('base64');
    res.redirect(`${redirectUri}?code=${code}&state=${state}`);
  });
}