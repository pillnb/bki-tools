CREATE TYPE "public"."approverRole" AS ENUM('lab_supervisor', 'coordinator', 'sm_operasi');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."borrowing_status" AS ENUM('pending_approval', 'approved', 'borrowed', 'returned', 'overdue', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."calibration_result" AS ENUM('passed', 'failed', 'conditional');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'lab_supervisor', 'coordinator', 'sm_operasi');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('available', 'in_use', 'needs_calibration', 'damaged', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('available', 'low_stock', 'out_of_stock');--> statement-breakpoint
CREATE TABLE "appSettings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appSettings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appSettings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "approvals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"borrowingId" integer NOT NULL,
	"approverRole" "approverRole" NOT NULL,
	"approverId" integer,
	"status" "approval_status" DEFAULT 'pending',
	"signatureData" text,
	"signedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "borrowingDetails" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "borrowingDetails_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"borrowingId" integer NOT NULL,
	"toolId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"returnedQuantity" integer DEFAULT 0 NOT NULL,
	"condition" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibrationHistory" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "calibrationHistory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"toolId" integer NOT NULL,
	"calibrationDate" timestamp NOT NULL,
	"nextCalibrationDate" timestamp NOT NULL,
	"calibrationProvider" varchar(100),
	"certificateNo" varchar(100),
	"certificateUrl" varchar(255),
	"result" "calibration_result" NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stockItems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stockItems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"itemId" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"unit" varchar(20),
	"quantity" integer DEFAULT 0 NOT NULL,
	"minThreshold" integer DEFAULT 5 NOT NULL,
	"maxThreshold" integer DEFAULT 100 NOT NULL,
	"unitPrice" numeric(10, 2),
	"supplier" varchar(100),
	"location" varchar(100),
	"status" "stock_status" DEFAULT 'available',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stockItems_itemId_unique" UNIQUE("itemId")
);
--> statement-breakpoint
CREATE TABLE "stockUsages" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stockUsages_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"usageId" varchar(50) NOT NULL,
	"itemId" integer NOT NULL,
	"usedBy" integer NOT NULL,
	"quantity" integer NOT NULL,
	"usageDate" timestamp NOT NULL,
	"purpose" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stockUsages_usageId_unique" UNIQUE("usageId")
);
--> statement-breakpoint
CREATE TABLE "toolBorrowings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "toolBorrowings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"borrowingId" varchar(50) NOT NULL,
	"borrowerId" integer NOT NULL,
	"borrowDate" timestamp NOT NULL,
	"expectedReturnDate" timestamp NOT NULL,
	"actualReturnDate" timestamp,
	"purpose" text,
	"status" "borrowing_status" DEFAULT 'pending_approval',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "toolBorrowings_borrowingId_unique" UNIQUE("borrowingId")
);
--> statement-breakpoint
CREATE TABLE "toolUsageHistory" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "toolUsageHistory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"toolId" integer NOT NULL,
	"borrowingId" integer NOT NULL,
	"usageCount" integer DEFAULT 1 NOT NULL,
	"lastUsedDate" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tools_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"toolId" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"serialNo" varchar(100),
	"brand" varchar(100),
	"model" varchar(100),
	"specification" text,
	"lastCalibrationDate" timestamp,
	"nextCalibrationDate" timestamp,
	"calibrationCertificateUrl" varchar(255),
	"usageProcedureUrl" varchar(255),
	"status" "status" DEFAULT 'available',
	"location" varchar(100),
	"assignedTo" integer,
	"barcodeData" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tools_toolId_unique" UNIQUE("toolId"),
	CONSTRAINT "tools_serialNo_unique" UNIQUE("serialNo")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_borrowingId_toolBorrowings_id_fk" FOREIGN KEY ("borrowingId") REFERENCES "public"."toolBorrowings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_users_id_fk" FOREIGN KEY ("approverId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowingDetails" ADD CONSTRAINT "borrowingDetails_borrowingId_toolBorrowings_id_fk" FOREIGN KEY ("borrowingId") REFERENCES "public"."toolBorrowings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrowingDetails" ADD CONSTRAINT "borrowingDetails_toolId_tools_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibrationHistory" ADD CONSTRAINT "calibrationHistory_toolId_tools_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockUsages" ADD CONSTRAINT "stockUsages_itemId_stockItems_id_fk" FOREIGN KEY ("itemId") REFERENCES "public"."stockItems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockUsages" ADD CONSTRAINT "stockUsages_usedBy_users_id_fk" FOREIGN KEY ("usedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolBorrowings" ADD CONSTRAINT "toolBorrowings_borrowerId_users_id_fk" FOREIGN KEY ("borrowerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolUsageHistory" ADD CONSTRAINT "toolUsageHistory_toolId_tools_id_fk" FOREIGN KEY ("toolId") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "toolUsageHistory" ADD CONSTRAINT "toolUsageHistory_borrowingId_toolBorrowings_id_fk" FOREIGN KEY ("borrowingId") REFERENCES "public"."toolBorrowings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_assignedTo_users_id_fk" FOREIGN KEY ("assignedTo") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;