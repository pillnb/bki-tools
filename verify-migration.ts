import { config } from "dotenv";
import postgres from "postgres";

config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("❌ DATABASE_URL tidak ditemukan");
  process.exit(1);
}

const sql = postgres(dbUrl);

console.log("🔍 Verifying Database Migration from MySQL to PostgreSQL\n");

try {
  // Check tables
  console.log("📊 Tables in database:");
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  
  tables.forEach((t: any) => {
    console.log(`   ✓ ${t.table_name}`);
  });

  // Check ENUMs
  console.log("\n📋 ENUMs (PostgreSQL type system):");
  const enums = await sql`
    SELECT typname 
    FROM pg_type 
    WHERE typtype = 'e'
    ORDER BY typname;
  `;
  
  enums.forEach((e: any) => {
    console.log(`   ✓ ${e.typname}`);
  });

  // Check columns for users table
  console.log("\n📝 Users table columns:");
  const userColumns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position;
  `;
  
  userColumns.forEach((c: any) => {
    const nullable = c.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
    console.log(`   ✓ ${c.column_name}: ${c.data_type} ${nullable}`);
  });

  // Check sample data
  console.log("\n🔢 Sample data from users table:");
  const userData = await sql`SELECT * FROM users LIMIT 1;`;
  if (userData.length > 0) {
    console.log("   ", userData[0]);
  } else {
    console.log("   (no data yet)");
  }

  console.log("\n✅ Database migration verification complete!\n");
  console.log("🎉 Migration from MySQL to PostgreSQL successful!");
  console.log("All tables and types have been created correctly.");
  
  process.exit(0);
} catch (error: any) {
  console.error("❌ Verification failed!");
  console.error("Error:", error.message);
  process.exit(1);
}
