import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  // In this app we always provide a default user in createContext, so treat
  // user as non-nullable to simplify downstream checks.
  user: User;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Always return a default admin user
  const user: User = {
    id: 1,
    openId: 'default-admin',
    name: 'Admin',
    email: 'admin@local',
    role: 'admin' as const,
    loginMethod: 'none',
    lastSignedIn: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
