#!/usr/bin/env node

/**
 * Vercel Deployment Migration Script
 * 
 * Script ini membantu memverifikasi setup Vercel sudah benar
 * sebelum deployment. Run: npx ts-node scripts/verify-vercel-setup.ts
 */

import fs from "fs";
import path from "path";

const checks = {
  files: [
    { path: "api/index.ts", desc: "Vercel Functions entry point" },
    { path: "server/_core/db-connection.ts", desc: "DB connection manager" },
    { path: "server/_core/vercel-handler.ts", desc: "Express handler" },
    { path: "vercel.json", desc: "Vercel configuration" },
    { path: ".env.production.example", desc: "Environment template" },
  ],
  docs: [
    { path: "VERCEL_DEPLOYMENT.md", desc: "Full deployment guide" },
    { path: "VERCEL_QUICKSTART.md", desc: "Quick start" },
    { path: "VERCEL_ARCHITECTURE.md", desc: "Architecture docs" },
    { path: "DEPLOYMENT_CHECKLIST.md", desc: "Deployment checklist" },
  ],
};

function checkFile(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function main() {
  console.log("📋 Vercel Setup Verification\n");
  console.log("=" .repeat(60));

  let allPassed = true;

  // Check core files
  console.log("\n✅ Core Files:");
  for (const file of checks.files) {
    const exists = checkFile(file.path);
    const status = exists ? "✅" : "❌";
    console.log(`${status} ${file.path.padEnd(40)} - ${file.desc}`);
    if (!exists) allPassed = false;
  }

  // Check documentation
  console.log("\n📚 Documentation Files:");
  for (const doc of checks.docs) {
    const exists = checkFile(doc.path);
    const status = exists ? "✅" : "⚠️";
    console.log(`${status} ${doc.path.padEnd(40)} - ${doc.desc}`);
  }

  // Check environment
  console.log("\n🌍 Environment Files:");
  const envExists = checkFile(".env");
  const envProdExists = checkFile(".env.production.example");
  console.log(`${envExists ? "✅" : "⚠️"} .env${envExists ? " (exists)" : " (local dev only)"}`);
  console.log(`${envProdExists ? "✅" : "⚠️"} .env.production.example`);

  // Summary
  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("\n🎉 All core files are ready for Vercel deployment!\n");
    console.log("📝 Next steps:");
    console.log("  1. Read: VERCEL_QUICKSTART.md");
    console.log("  2. Setup Vercel environment variables");
    console.log("  3. Deploy: git push or vercel --prod\n");
  } else {
    console.log("\n❌ Some files are missing. Run setup script.\n");
  }
}

main();
