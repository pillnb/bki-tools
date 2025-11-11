import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ============ VALIDATION SCHEMAS ============

const CreateToolSchema = z.object({
  toolId: z.string().min(1),
  name: z.string().min(1),
  serialNo: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  specification: z.string().optional(),
  lastCalibrationDate: z.string().optional(),
  nextCalibrationDate: z.string().optional(),
  calibrationCertificateUrl: z.string().optional(),
  usageProcedureUrl: z.string().optional(),
  status: z.enum(["available", "in_use", "needs_calibration", "damaged", "maintenance"]).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateToolSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  serialNo: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  specification: z.string().optional(),
  status: z.enum(["available", "in_use", "needs_calibration", "damaged", "maintenance"]).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const CreateStockItemSchema = z.object({
  itemId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().default(0),
  minThreshold: z.number().int().default(5),
  maxThreshold: z.number().int().default(100),
  unitPrice: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const UpdateStockItemSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().int().optional(),
  minThreshold: z.number().int().optional(),
  maxThreshold: z.number().int().optional(),
  unitPrice: z.string().optional(),
  supplier: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

const CreateToolBorrowingSchema = z.object({
  borrowingId: z.string().min(1),
  toolIds: z.array(z.number()).min(1).max(5), // Max 5 tools per borrowing
  borrowDate: z.date(),
  expectedReturnDate: z.date(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const CreateStockUsageSchema = z.object({
  usageId: z.string().min(1),
  itemId: z.number(),
  quantity: z.number().int().min(1),
  usageDate: z.date(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const CreateApprovalSchema = z.object({
  borrowingId: z.number(),
  approverRole: z.enum(["lab_supervisor", "coordinator", "sm_operasi"]),
  signatureData: z.string().optional(),
  notes: z.string().optional(),
});

// ============ TOOLS ROUTER ============

const toolsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllTools();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const tool = await db.getToolById(input.id);
      if (!tool) throw new TRPCError({ code: "NOT_FOUND" });
      return tool;
    }),

  getByToolId: protectedProcedure
    .input(z.object({ toolId: z.string() }))
    .query(async ({ input }) => {
      return await db.getToolByToolId(input.toolId);
    }),

  create: protectedProcedure
    .input(CreateToolSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admin and lab_supervisor can create tools
      if (!["admin", "lab_supervisor"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const toolData = {
        ...input,
        lastCalibrationDate: input.lastCalibrationDate ? new Date(input.lastCalibrationDate) : null,
        nextCalibrationDate: input.nextCalibrationDate ? new Date(input.nextCalibrationDate) : null,
        calibrationCertificateUrl: input.calibrationCertificateUrl || null,
        usageProcedureUrl: input.usageProcedureUrl || null,
        status: input.status || "available",
        assignedTo: ctx.user.id,
      };

      return await db.createTool(toolData);
    }),

  update: protectedProcedure
    .input(UpdateToolSchema)
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "lab_supervisor"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...data } = input;
      return await db.updateTool(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.deleteTool(input.id);
    }),

  getByStatus: protectedProcedure
    .input(z.object({ status: z.string() }))
    .query(async ({ input }) => {
      return await db.getToolsByStatus(input.status);
    }),
});

// ============ STOCK ITEMS ROUTER ============

const stockRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllStockItems();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await db.getStockItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  getLowStock: protectedProcedure.query(async () => {
    return await db.getLowStockItems();
  }),

  create: protectedProcedure
    .input(CreateStockItemSchema)
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "lab_supervisor"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.createStockItem({
        ...input,
        status: "available",
      });
    }),

  update: protectedProcedure
    .input(UpdateStockItemSchema)
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "lab_supervisor"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...data } = input;
      return await db.updateStockItem(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.deleteStockItem(input.id);
    }),
});

// ============ BORROWINGS ROUTER ============

const borrowingsRouter = router({
  list: protectedProcedure.query(async () => {
    return await db.getAllToolBorrowings();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const borrowing = await db.getToolBorrowingById(input.id);
      if (!borrowing) throw new TRPCError({ code: "NOT_FOUND" });
      return borrowing;
    }),

  getByBorrowingId: protectedProcedure
    .input(z.object({ borrowingId: z.string() }))
    .query(async ({ input }) => {
      return await db.getToolBorrowingByBorrowingId(input.borrowingId);
    }),

  getMyBorrowings: protectedProcedure.query(async ({ ctx }) => {
    return await db.getToolBorrowingsByBorrower(ctx.user.id);
  }),

  getPending: protectedProcedure.query(async ({ ctx }) => {
    if (!["admin", "coordinator", "sm_operasi"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return await db.getPendingApprovals();
  }),

  create: protectedProcedure
    .input(CreateToolBorrowingSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if borrowing ID already exists
      const existing = await db.getToolBorrowingByBorrowingId(input.borrowingId);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Borrowing ID already exists" });
      }

      // Create borrowing
      const borrowing = await db.createToolBorrowing({
        borrowingId: input.borrowingId,
        borrowerId: ctx.user.id,
        borrowDate: input.borrowDate,
        expectedReturnDate: input.expectedReturnDate,
        purpose: input.purpose,
        notes: input.notes,
        status: "pending_approval",
      });

      // Create borrowing details for each tool. Normalize the created borrowing
      // result to an insertion id when possible (some adapters return arrays).
      const borrowingInsertId = (borrowing as any)?.insertId ?? (borrowing as any)?.[0]?.insertId;
      for (const toolId of input.toolIds) {
        await db.createBorrowingDetail({
          borrowingId: borrowingInsertId,
          toolId,
          quantity: 1,
          returnedQuantity: 0,
        });
      }

      // Create approval records for each role
      const borrowingId = borrowingInsertId;
      const roles = ["lab_supervisor", "coordinator", "sm_operasi"];
      for (const role of roles) {
        await db.createApproval({
          borrowingId,
          approverRole: role as any,
          status: "pending",
        });
      }

      return borrowing;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!["admin", "coordinator"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db.updateToolBorrowing(input.id, { status: input.status as any });
    }),
});

// ============ BORROWING DETAILS ROUTER ============

const borrowingDetailsRouter = router({
  getByBorrowingId: protectedProcedure
    .input(z.object({ borrowingId: z.number() }))
    .query(async ({ input }) => {
      return await db.getBorrowingDetailsByBorrowingId(input.borrowingId);
    }),
});

// ============ APPROVALS ROUTER ============

const approvalsRouter = router({
  getByBorrowingId: protectedProcedure
    .input(z.object({ borrowingId: z.number() }))
    .query(async ({ input }) => {
      return await db.getApprovalsByBorrowingId(input.borrowingId);
    }),

  getByRole: protectedProcedure
    .input(z.object({ borrowingId: z.number(), role: z.string() }))
    .query(async ({ input }) => {
      return await db.getApprovalsByRole(input.borrowingId, input.role);
    }),

  getPendingForUser: protectedProcedure.query(async ({ ctx }) => {
    return await db.getPendingApprovalsForUser(ctx.user.id, ctx.user.role);
  }),

  approve: protectedProcedure
    .input(CreateApprovalSchema)
    .mutation(async ({ input, ctx }) => {
      // Get existing approval
      const approval = await db.getApprovalsByRole(input.borrowingId, input.approverRole);
      
      if (!approval || !approval.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Update approval
      return await db.updateApproval(approval.id as number, {
        status: "approved",
        approverId: ctx.user.id,
        signatureData: input.signatureData,
        signedAt: new Date(),
        notes: input.notes,
      });
    }),

  reject: protectedProcedure
    .input(z.object({ borrowingId: z.number(), approverRole: z.string(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const approval = await db.getApprovalsByRole(input.borrowingId, input.approverRole);
      
      if (!approval || !approval.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Update approval to rejected
      await db.updateApproval(approval.id as number, {
        status: "rejected",
        approverId: ctx.user.id,
        signedAt: new Date(),
        notes: input.notes,
      });

      // Update borrowing status to rejected
      return await db.updateToolBorrowing(input.borrowingId, { status: "rejected" });
    }),
});

// ============ STOCK USAGES ROUTER ============

const stockUsagesRouter = router({
  create: protectedProcedure
    .input(CreateStockUsageSchema)
    .mutation(async ({ input, ctx }) => {
      // Get stock item
      const item = await db.getStockItemById(input.itemId);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stock item not found" });
      }

      // Check if enough stock
      if (item.quantity < input.quantity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient stock" });
      }

      // Create usage record
      const usage = await db.createStockUsage({
        usageId: input.usageId,
        itemId: input.itemId,
        usedBy: ctx.user.id,
        quantity: input.quantity,
        usageDate: input.usageDate,
        purpose: input.purpose,
        notes: input.notes,
      });

      // Update stock quantity
      const newQuantity = item.quantity - input.quantity;
      let newStatus = "available";
      if (newQuantity <= item.minThreshold) {
        newStatus = "low_stock";
      }
      if (newQuantity === 0) {
        newStatus = "out_of_stock";
      }

      await db.updateStockItem(input.itemId, {
        quantity: newQuantity,
        status: newStatus as any,
      });

      return usage;
    }),

  getByItemId: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ input }) => {
      return await db.getStockUsagesByItemId(input.itemId);
    }),

  getMyUsages: protectedProcedure.query(async ({ ctx }) => {
    return await db.getStockUsagesByUserId(ctx.user.id);
  }),
});

// ============ ANALYTICS ROUTER ============

const analyticsRouter = router({
  getMostUsedTools: protectedProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ input }) => {
      return await db.getMostUsedTools(input.limit);
    }),

  getToolBorrowingStats: protectedProcedure.query(async () => {
    const borrowings = await db.getAllToolBorrowings();
    
    // Count borrowings by tool
    const toolStats: Record<number, number> = {};
    for (const borrowing of borrowings) {
      const details = await db.getBorrowingDetailsByBorrowingId(borrowing.id);
      for (const detail of details) {
        toolStats[detail.toolId] = (toolStats[detail.toolId] || 0) + 1;
      }
    }

    return toolStats;
  }),

  getStockUsageStats: protectedProcedure.query(async () => {
    const items = await db.getAllStockItems();
    const stats: Record<number, number> = {};

    for (const item of items) {
      const usages = await db.getStockUsagesByItemId(item.id);
      stats[item.id] = usages.length;
    }

    return stats;
  }),
});

// ============ USERS ROUTER ============

const usersRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return await db.getAllUsers();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await db.getUserById(input.id);
    }),
});

// ============ MAIN ROUTER ============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  tools: toolsRouter,
  stock: stockRouter,
  borrowings: borrowingsRouter,
  borrowingDetails: borrowingDetailsRouter,
  approvals: approvalsRouter,
  stockUsages: stockUsagesRouter,
  analytics: analyticsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
