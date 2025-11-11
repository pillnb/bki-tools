/**
 * Global database connection manager untuk Vercel Functions
 * Menggunakan pattern global connection reuse untuk menghindari memory leak
 * dan cold start issues di serverless environment.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

let globalDb: ReturnType<typeof drizzle> | null = null;
let globalClient: ReturnType<typeof postgres> | null = null;

/**
 * Mendapatkan database connection yang sudah di-cache secara global.
 * Koneksi digunakan ulang untuk setiap request untuk efisiensi maksimal.
 * 
 * Konfigurasi pgBouncer:
 * - Port: 6543 (transaction pooling mode)
 * - Max connections per app: 10 (disesuaikan untuk serverless)
 * - Idle timeout: 60s
 */
export async function getDbConnection(): Promise<ReturnType<typeof drizzle> | null> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn("[Database] DATABASE_URL tidak ditemukan di environment");
    return null;
  }

  // Return koneksi yang sudah ada jika tersedia
  if (globalDb && globalClient) {
    return globalDb;
  }

  try {
    // Konfigurasi postgres client untuk serverless environment
    // - max: jumlah koneksi maksimal di pool
    // - connect_timeout: timeout untuk koneksi baru
    // - statement_timeout: timeout untuk setiap query
    globalClient = postgres(databaseUrl, {
      max: 10, // Jumlah koneksi pool yang wajar untuk Vercel
      connect_timeout: 10, // 10 detik timeout connect
    });

    globalDb = drizzle(globalClient);

    // Test koneksi
    await globalDb.execute(sql`SELECT 1`);
    console.log("[Database] Koneksi berhasil diinisialisasi (reuse global connection)");

    return globalDb;
  } catch (error) {
    console.error("[Database] Gagal menginisialisasi koneksi:", error);
    globalDb = null;
    globalClient = null;
    return null;
  }
}

/**
 * Close koneksi database (dipanggil saat environment shutdown)
 * CATATAN: Vercel Functions biasanya tidak perlu close connection secara eksplisit
 * karena runtime di-terminate, tetapi disediakan untuk testing/graceful shutdown.
 */
export async function closeDbConnection(): Promise<void> {
  if (globalClient) {
    try {
      await globalClient.end();
      console.log("[Database] Koneksi ditutup");
    } catch (error) {
      console.error("[Database] Error saat menutup koneksi:", error);
    } finally {
      globalDb = null;
      globalClient = null;
    }
  }
}

/**
 * Health check untuk database
 */
export async function isDbHealthy(): Promise<boolean> {
  try {
    const db = await getDbConnection();
    if (!db) return false;
    
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error("[Database] Health check failed:", error);
    return false;
  }
}
