import { config } from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, tools, stockItems, toolBorrowings, approvals } from "./drizzle/schema";

config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL tidak ditemukan");
  process.exit(1);
}

console.log("🔍 Testing Backend Database Connection\n");

try {
  // Create postgres client
  const client = postgres(dbUrl);
  console.log("✓ Postgres client created");

  // Create drizzle instance
  const db = drizzle(client);
  console.log("✓ Drizzle ORM initialized");

  // Test query
  console.log("\n📝 Running test query: SELECT FROM users...");
  const result = await db.select().from(users).limit(1);
  console.log("✓ Query executed successfully");
  console.log("  Result:", result);

  // Test tools
  console.log("\n📝 Running test query: SELECT FROM tools...");
  const toolsResult = await db.select().from(tools).limit(1);
  console.log("✓ Query executed successfully");
  console.log("  Tools count:", toolsResult.length);
  if (toolsResult.length > 0) {
    console.log("  First tool:", toolsResult[0]);
  }

  // Count all tables
  console.log("\n📊 Table row counts:");
  const counts = {
    users: await db.select().from(users),
    tools: await db.select().from(tools),
    stockItems: await db.select().from(stockItems),
    toolBorrowings: await db.select().from(toolBorrowings),
    approvals: await db.select().from(approvals),
  };

  Object.entries(counts).forEach(([table, data]) => {
    console.log(`  ${table}: ${data.length} rows`);
  });

  console.log("\n✅ Backend database connection test successful!");
  process.exit(0);
} catch (error: any) {
  console.error("❌ Test failed!");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);
  process.exit(1);
}
