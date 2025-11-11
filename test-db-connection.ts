import { config } from "dotenv";
import postgres from "postgres";

config();

const dbUrl = process.env.DATABASE_URL;
console.log("📝 DATABASE_URL:", dbUrl?.replace(/:[^:]*@/, ":***@"));

if (!dbUrl) {
  console.error("❌ DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

// Test connection
console.log("\n🔄 Attempting to connect...");

try {
  const sql = postgres(dbUrl);
  
  await sql`SELECT 1 as test`.then(() => {
    console.log("✅ Connection successful!");
    process.exit(0);
  });
} catch (error: any) {
  console.error("❌ Connection failed!");
  console.error("   Error:", error.message);
  process.exit(1);
}
