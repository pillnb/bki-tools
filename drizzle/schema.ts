import { integer, text, timestamp, varchar, boolean, numeric, pgTable, pgEnum } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extended with role field for role-based access control.
 */
export const roleEnum = pgEnum("role", ["user", "admin", "lab_supervisor", "coordinator", "sm_operasi"]);
export const statusEnum = pgEnum("status", ["available", "in_use", "needs_calibration", "damaged", "maintenance"]);
export const stockStatusEnum = pgEnum("stock_status", ["available", "low_stock", "out_of_stock"]);
export const borrowingStatusEnum = pgEnum("borrowing_status", ["pending_approval", "approved", "borrowed", "returned", "overdue", "rejected"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabel untuk data alat inspeksi
 */
export const tools = pgTable("tools", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  toolId: varchar("toolId", { length: 50 }).notNull().unique(), // EL-MT-001
  name: varchar("name", { length: 100 }).notNull(),
  serialNo: varchar("serialNo", { length: 100 }).unique(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  specification: text("specification"), // Spesifikasi teknis alat
  lastCalibrationDate: timestamp("lastCalibrationDate"),
  nextCalibrationDate: timestamp("nextCalibrationDate"),
  calibrationCertificateUrl: varchar("calibrationCertificateUrl", { length: 255 }), // Link ke sertifikat kalibrasi
  usageProcedureUrl: varchar("usageProcedureUrl", { length: 255 }), // Link ke prosedur penggunaan
  status: statusEnum("status").default("available"),
  location: varchar("location", { length: 100 }),
  assignedTo: integer("assignedTo").references(() => users.id, { onDelete: "set null" }), // User yang bertanggung jawab
  barcodeData: text("barcodeData"), // Data untuk barcode (JSON format)
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Tool = typeof tools.$inferSelect;
export type InsertTool = typeof tools.$inferInsert;

/**
 * Tabel untuk stok barang habis pakai
 */
export const stockItems = pgTable("stockItems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  itemId: varchar("itemId", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 20 }), // pcs, box, meter, dll
  quantity: integer("quantity").notNull().default(0),
  minThreshold: integer("minThreshold").notNull().default(5), // Minimal stock untuk trigger alarm
  maxThreshold: integer("maxThreshold").notNull().default(100), // Maksimal stock
  unitPrice: numeric("unitPrice", { precision: 10, scale: 2 }),
  supplier: varchar("supplier", { length: 100 }),
  location: varchar("location", { length: 100 }),
  status: stockStatusEnum("status").default("available"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type StockItem = typeof stockItems.$inferSelect;
export type InsertStockItem = typeof stockItems.$inferInsert;

/**
 * Tabel untuk pencatatan peminjaman alat
 */
export const toolBorrowings = pgTable("toolBorrowings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  borrowingId: varchar("borrowingId", { length: 50 }).notNull().unique(),
  borrowerId: integer("borrowerId").notNull().references(() => users.id),
  borrowDate: timestamp("borrowDate").notNull(),
  expectedReturnDate: timestamp("expectedReturnDate").notNull(),
  actualReturnDate: timestamp("actualReturnDate"),
  purpose: text("purpose"),
  status: borrowingStatusEnum("status").default("pending_approval"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ToolBorrowing = typeof toolBorrowings.$inferSelect;
export type InsertToolBorrowing = typeof toolBorrowings.$inferInsert;

/**
 * Tabel untuk detail alat yang dipinjam (relasi many-to-many)
 */
export const borrowingDetails = pgTable("borrowingDetails", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  borrowingId: integer("borrowingId").notNull().references(() => toolBorrowings.id, { onDelete: "cascade" }),
  toolId: integer("toolId").notNull().references(() => tools.id),
  quantity: integer("quantity").notNull().default(1),
  returnedQuantity: integer("returnedQuantity").notNull().default(0),
  condition: varchar("condition", { length: 100 }), // Kondisi saat dikembalikan
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BorrowingDetail = typeof borrowingDetails.$inferSelect;
export type InsertBorrowingDetail = typeof borrowingDetails.$inferInsert;

/**
 * Tabel untuk approval workflow (e-signature)
 */
export const approvalRoleEnum = pgEnum("approverRole", ["lab_supervisor", "coordinator", "sm_operasi"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const approvals = pgTable("approvals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  borrowingId: integer("borrowingId").notNull().references(() => toolBorrowings.id, { onDelete: "cascade" }),
  approverRole: approvalRoleEnum("approverRole").notNull(),
  approverId: integer("approverId").references(() => users.id),
  status: approvalStatusEnum("status").default("pending"),
  signatureData: text("signatureData"), // Base64 encoded signature
  signedAt: timestamp("signedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

/**
 * Tabel untuk pencatatan pemakaian barang
 */
export const stockUsages = pgTable("stockUsages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  usageId: varchar("usageId", { length: 50 }).notNull().unique(),
  itemId: integer("itemId").notNull().references(() => stockItems.id),
  usedBy: integer("usedBy").notNull().references(() => users.id),
  quantity: integer("quantity").notNull(),
  usageDate: timestamp("usageDate").notNull(),
  purpose: text("purpose"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockUsage = typeof stockUsages.$inferSelect;
export type InsertStockUsage = typeof stockUsages.$inferInsert;

/**
 * Tabel untuk riwayat kalibrasi alat
 */
export const calibrationResultEnum = pgEnum("calibration_result", ["passed", "failed", "conditional"]);
export const calibrationHistory = pgTable("calibrationHistory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  toolId: integer("toolId").notNull().references(() => tools.id, { onDelete: "cascade" }),
  calibrationDate: timestamp("calibrationDate").notNull(),
  nextCalibrationDate: timestamp("nextCalibrationDate").notNull(),
  calibrationProvider: varchar("calibrationProvider", { length: 100 }),
  certificateNo: varchar("certificateNo", { length: 100 }),
  certificateUrl: varchar("certificateUrl", { length: 255 }),
  result: calibrationResultEnum("result").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CalibrationHistory = typeof calibrationHistory.$inferSelect;
export type InsertCalibrationHistory = typeof calibrationHistory.$inferInsert;

/**
 * Tabel untuk riwayat penggunaan alat (analytics)
 */
export const toolUsageHistory = pgTable("toolUsageHistory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  toolId: integer("toolId").notNull().references(() => tools.id),
  borrowingId: integer("borrowingId").notNull().references(() => toolBorrowings.id),
  usageCount: integer("usageCount").notNull().default(1),
  lastUsedDate: timestamp("lastUsedDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ToolUsageHistory = typeof toolUsageHistory.$inferSelect;
export type InsertToolUsageHistory = typeof toolUsageHistory.$inferInsert;

/**
 * Tabel untuk konfigurasi dan setting aplikasi
 */
export const appSettings = pgTable("appSettings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = typeof appSettings.$inferInsert;
