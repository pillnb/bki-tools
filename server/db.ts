import { eq, desc, and, gte, lte, sql, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, 
  tools, InsertTool, Tool,
  stockItems, InsertStockItem, StockItem,
  toolBorrowings, InsertToolBorrowing, ToolBorrowing,
  borrowingDetails, InsertBorrowingDetail, BorrowingDetail,
  approvals, InsertApproval, Approval,
  stockUsages, InsertStockUsage, StockUsage,
  calibrationHistory, InsertCalibrationHistory, CalibrationHistory,
  toolUsageHistory, InsertToolUsageHistory, ToolUsageHistory,
  appSettings, InsertAppSetting, AppSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL uses onConflict instead of onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(asc(users.name));
}

// ============ TOOLS QUERIES ============

export async function createTool(data: InsertTool) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Defensive: if assignedTo references a user that doesn't exist in the users
  // table, set it to null to avoid a foreign-key violation during insert.
  const insertData: Partial<InsertTool> = { ...data };
  try {
    if (insertData.assignedTo !== undefined && insertData.assignedTo !== null) {
      const existing = await db.select().from(users).where(eq(users.id, insertData.assignedTo)).limit(1);
      if (!existing || existing.length === 0) {
        insertData.assignedTo = null as any;
      }
    }

    const result = await db.insert(tools).values(insertData as InsertTool).returning();
    return result;
  } catch (error) {
    console.error("[Database] Failed to create tool:", error);
    throw error;
  }
}

export async function updateTool(id: number, data: Partial<InsertTool>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(tools).set(data).where(eq(tools.id, id));
}

export async function getToolById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getToolByToolId(toolId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tools).where(eq(tools.toolId, toolId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTools() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tools).orderBy(asc(tools.toolId));
}

export async function getToolsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tools).where(eq(tools.status, status as any));
}

export async function deleteTool(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(tools).where(eq(tools.id, id));
}

// ============ STOCK ITEMS QUERIES ============

export async function createStockItem(data: InsertStockItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(stockItems).values(data);
}

export async function updateStockItem(id: number, data: Partial<InsertStockItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(stockItems).set(data).where(eq(stockItems.id, id));
}

export async function getStockItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(stockItems).where(eq(stockItems.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllStockItems() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(stockItems).orderBy(asc(stockItems.itemId));
}

export async function getLowStockItems() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(stockItems)
    .where(sql`${stockItems.quantity} <= ${stockItems.minThreshold}`)
    .orderBy(asc(stockItems.quantity));
}

export async function deleteStockItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(stockItems).where(eq(stockItems.id, id));
}

// ============ TOOL BORROWINGS QUERIES ============

export async function createToolBorrowing(data: InsertToolBorrowing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(toolBorrowings).values(data);
}

export async function updateToolBorrowing(id: number, data: Partial<InsertToolBorrowing>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(toolBorrowings).set(data).where(eq(toolBorrowings.id, id));
}

export async function getToolBorrowingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(toolBorrowings).where(eq(toolBorrowings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getToolBorrowingByBorrowingId(borrowingId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(toolBorrowings).where(eq(toolBorrowings.borrowingId, borrowingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllToolBorrowings() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(toolBorrowings).orderBy(desc(toolBorrowings.borrowDate));
}

export async function getToolBorrowingsByBorrower(borrowerId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(toolBorrowings)
    .where(eq(toolBorrowings.borrowerId, borrowerId))
    .orderBy(desc(toolBorrowings.borrowDate));
}

export async function getPendingApprovals() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(toolBorrowings)
    .where(eq(toolBorrowings.status, "pending_approval"))
    .orderBy(asc(toolBorrowings.borrowDate));
}

// ============ BORROWING DETAILS QUERIES ============

export async function createBorrowingDetail(data: InsertBorrowingDetail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(borrowingDetails).values(data);
}

export async function getBorrowingDetailsByBorrowingId(borrowingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(borrowingDetails)
    .where(eq(borrowingDetails.borrowingId, borrowingId));
}

export async function deleteBorrowingDetail(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(borrowingDetails).where(eq(borrowingDetails.id, id));
}

// ============ APPROVALS QUERIES ============

export async function createApproval(data: InsertApproval) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(approvals).values(data);
}

export async function updateApproval(id: number, data: Partial<InsertApproval>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(approvals).set(data).where(eq(approvals.id, id));
}

export async function getApprovalsByBorrowingId(borrowingId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(approvals)
    .where(eq(approvals.borrowingId, borrowingId))
    .orderBy(asc(approvals.approverRole));
}

export async function getApprovalsByRole(borrowingId: number, role: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(approvals)
    .where(and(
      eq(approvals.borrowingId, borrowingId),
      eq(approvals.approverRole, role as any)
    ))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function getPendingApprovalsForUser(userId: number, role: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(approvals)
    .where(and(
      eq(approvals.approverRole, role as any),
      eq(approvals.status, "pending")
    ))
    .orderBy(asc(approvals.createdAt));
}

// ============ STOCK USAGES QUERIES ============

export async function createStockUsage(data: InsertStockUsage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(stockUsages).values(data);
}

export async function getStockUsagesByItemId(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(stockUsages)
    .where(eq(stockUsages.itemId, itemId))
    .orderBy(desc(stockUsages.usageDate));
}

export async function getStockUsagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(stockUsages)
    .where(eq(stockUsages.usedBy, userId))
    .orderBy(desc(stockUsages.usageDate));
}

// ============ CALIBRATION HISTORY QUERIES ============

export async function createCalibrationHistory(data: InsertCalibrationHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(calibrationHistory).values(data);
}

export async function getCalibrationHistoryByToolId(toolId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(calibrationHistory)
    .where(eq(calibrationHistory.toolId, toolId))
    .orderBy(desc(calibrationHistory.calibrationDate));
}

// ============ TOOL USAGE HISTORY QUERIES ============

export async function createToolUsageHistory(data: InsertToolUsageHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(toolUsageHistory).values(data);
}

export async function getMostUsedTools(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(toolUsageHistory)
    .orderBy(desc(toolUsageHistory.usageCount))
    .limit(limit);
}

// ============ APP SETTINGS QUERIES ============

export async function getAppSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(appSettings)
    .where(eq(appSettings.key, key))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

export async function setAppSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getAppSetting(key);
  
  if (existing) {
    return await db.update(appSettings)
      .set({ value })
      .where(eq(appSettings.key, key));
  } else {
    return await db.insert(appSettings).values({ key, value });
  }
}
