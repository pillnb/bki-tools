# 🗄️ Panduan Migrasi: MySQL → PostgreSQL (Supabase)

## 📋 Ringkasan Perubahan

Aplikasi sudah berhasil dimigrasi dari **MySQL** ke **PostgreSQL** (Supabase) dengan URI:
```
postgresql://postgres:[YOUR_PASSWORD]@db.gufxiyxxbtaubmkckowi.supabase.co:5432/postgres
```

---

## ✅ Langkah-Langkah yang Sudah Dilakukan

### 1️⃣ **Update Dependencies** ✓
```bash
npm install postgres --legacy-peer-deps
```
- Menghapus `mysql2` driver
- Menambahkan `postgres` client untuk PostgreSQL

### 2️⃣ **Update Drizzle Config** ✓
File: `drizzle.config.ts`
```typescript
dialect: "postgresql"  // Diubah dari "mysql"
```

### 3️⃣ **Update Database Connection** ✓
File: `server/db.ts`
```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL);
_db = drizzle(client);
```

### 4️⃣ **Update Schema** ✓
File: `drizzle/schema.ts`
Perubahan:
- `mysqlTable()` → `pgTable()`
- `mysqlEnum()` → `pgEnum()`
- `int()` → `integer()`
- `decimal()` → `numeric()`
- `datetime()` → `timestamp()`
- `autoincrement()` → `generatedAlwaysAsIdentity()`
- `.onUpdateNow()` → Dihapus (PostgreSQL trigger `DEFAULT` saja)

Enums yang dibuat:
- `roleEnum`, `statusEnum`, `stockStatusEnum`
- `borrowingStatusEnum`, `approvalStatusEnum`
- `approvalRoleEnum`, `calibrationResultEnum`

### 5️⃣ **Update Environment** ✓
File: `.env`
```ini
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.gufxiyxxbtaubmkckowi.supabase.co:5432/postgres"
```

---

## 🚀 Langkah-Langkah yang Harus Dilakukan

### STEP 1: Update Password di .env
Ganti `[YOUR_PASSWORD]` dengan password Supabase Anda:
```ini
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.gufxiyxxbtaubmkckowi.supabase.co:5432/postgres"
```

### STEP 2: Generate Migration Files
```bash
npm run db:push
```
Atau:
```bash
npx drizzle-kit generate && npx drizzle-kit migrate
```

Ini akan:
- Membaca schema dari `drizzle/schema.ts`
- Membuat file migration SQL di folder `drizzle/migrations/`
- Menjalankan migration ke database Supabase

### STEP 3: Verify Database Connection
```bash
npm run build && npm run dev
```

Cek di terminal untuk error koneksi database.

### STEP 4: Test API
Buka `http://localhost:3000` dan coba:
1. Tambah alat baru
2. List alat
3. Export ke Excel
4. Download barcode

---

## ⚠️ Perbedaan Penting MySQL vs PostgreSQL

| Aspek | MySQL | PostgreSQL |
|-------|-------|-----------|
| **Primary Key** | `autoincrement()` | `generatedAlwaysAsIdentity()` |
| **Auto Update** | `.onUpdateNow()` | Trigger manual / `updatedAt` manual |
| **Enum** | `mysqlEnum()` | `pgEnum()` + CREATE TYPE |
| **Default Values** | `.default()` | `.default()` |
| **Datetime** | `datetime()` | `timestamp()` |
| **Numeric** | `decimal()` | `numeric()` |

---

## 🔧 Troubleshooting

### ❌ Error: "Cannot find module 'postgres'"
**Solusi:**
```bash
npm install postgres --legacy-peer-deps
```

### ❌ Error: "dialect is not 'postgresql'"
**Solusi:** Pastikan `drizzle.config.ts` sudah di-update ke `dialect: "postgresql"`

### ❌ Error: "Connection refused"
**Solusi:** 
1. Pastikan password di `.env` benar
2. Pastikan database Supabase sudah aktif
3. Cek firewall/network (Supabase memungkinkan akses dari mana saja)

### ❌ Error: "column does not exist"
**Solusi:** Jalankan migration:
```bash
npm run db:push
```

### ❌ Error: "Foreign key constraint"
**Solusi:** PostgreSQL mungkin memerlukan urutan penghapusan tabel. Jalankan:
```bash
npx drizzle-kit push
```

---

## 📝 Catatan Penting

1. **Trigger untuk `updatedAt`**: PostgreSQL tidak otomatis update field ini. Jika ingin auto-update, buat trigger:
```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
```

2. **UUID vs Integer ID**: Pertimbangkan menggunakan UUID untuk production:
```typescript
id: uuid("id").primaryKey().defaultRandom(),
```

3. **Connection Pooling**: Untuk production, gunakan PgBouncer atau Supabase connection pooling.

---

## ✨ Selesai!
Database sudah berhasil dikonfigurasi untuk PostgreSQL Supabase. 
Aplikasi siap dijalankan dengan database baru! 🎉
