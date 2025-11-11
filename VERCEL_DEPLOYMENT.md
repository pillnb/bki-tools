# Deployment ke Vercel dengan Drizzle ORM & Supabase

## Setup Vercel Functions dengan Express

Panduan lengkap untuk mendeploy aplikasi Vite + React dengan backend Express ke Vercel Functions tanpa `app.listen()` dan menggunakan global connection reuse.

## 📋 Prasyarat

- Supabase PostgreSQL dengan pgBouncer (port 6543)
- Vercel account
- Vite + React project (existing)
- Drizzle ORM + postgres driver (sudah terinstall)

## 🔧 Setup Backend

### 1. Siapkan Database Connection Manager

File: `server/_core/db-connection.ts`
- Mengimplementasikan global connection caching
- Reuse koneksi untuk setiap request (efisien untuk serverless)
- Health check endpoint

### 2. Siapkan Vercel Handler

File: `server/_core/vercel-handler.ts`
- Express app tanpa `app.listen()`
- CORS middleware
- tRPC integration
- OAuth routes
- Health check endpoint

## 📁 Struktur File untuk Deployment

Untuk Vercel + Vite, buat struktur ini:

```
api/
  index.ts                    # Main handler untuk Vercel
server/
  _core/
    db-connection.ts          # (sudah ada)
    vercel-handler.ts         # (sudah ada)
    context.ts                # (sudah ada)
    oauth.ts                  # (sudah ada)
  db.ts                       # (sudah ada)
  routers.ts                  # (sudah ada)
client/
  ...
vercel.json                   # Konfigurasi Vercel (buat baru)
.env.production               # Environment production (buat baru)
```

## 📄 File yang Perlu Dibuat/Dimodifikasi

### 1. `api/index.ts` (Buat Baru)

```typescript
import "dotenv/config";
import { getDbConnection } from "../server/_core/db-connection";

// Initialize DB connection
getDbConnection().catch(console.error);

// Import dan export handler Vercel
export { default } from "../server/_core/vercel-handler";
```

### 2. `vercel.json` (Buat Baru)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/index.ts": {
      "memory": 512,
      "maxDuration": 30
    }
  }
}
```

### 3. `.env.production` (Buat Baru)

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password%40@db.pooler.supabase.com:6543/postgres?schema=public
JWT_SECRET=your_jwt_secret
BASE_URL=https://your-domain.vercel.app
```

**PENTING**: Encode password jika ada `@` character:
```
password@123 → password%40123
```

## 🚀 Deploy ke Vercel

### Opsi 1: Via Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Connect Git repository
3. Di "Build & Development Settings":
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Di "Environment Variables", tambahkan:
   - `DATABASE_URL` (dari Supabase)
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID` (jika ada)
   - `GOOGLE_CLIENT_SECRET` (jika ada)
5. Deploy

### Opsi 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --env DATABASE_URL=postgresql://... --env JWT_SECRET=...

# View logs
vercel logs api/index.ts --follow
```

## 🌐 Client-Side Configuration

Update client tRPC client untuk production URL:

File: `client/src/lib/trpc.ts`

```typescript
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers";

const getApiUrl = () => {
  if (typeof window === "undefined") {
    return process.env.VITE_API_URL || "http://localhost:3000";
  }

  // Client-side: gunakan relative URL atau environment variable
  return process.env.VITE_API_URL || "/api/trpc";
};

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: getApiUrl(),
      fetch: async (input, init?) => {
        const fetch_ =
          typeof window === "undefined"
            ? (await import("node-fetch")).default
            : window.fetch;
        return fetch_(input, {
          ...init,
          credentials: "include",
        });
      },
    }),
  ],
});
```

Tambahkan env variable di `.env.production`:

```
VITE_API_URL=https://your-domain.vercel.app/api/trpc
```

## 🔌 Connection Pooling Config (Supabase)

Pastikan di Supabase dashboard → Connection pooler:

- **Host**: `db.pooler.supabase.com`
- **Port**: `6543` (transaction pooling)
- **Max connections**: 10-20 (sesuaikan kebutuhan)
- **Idle timeout**: 60 detik

DATABASE_URL format:
```
postgresql://[user]:[password]@db.pooler.supabase.com:6543/[database]?schema=public
```

## ✅ Health Check

Test deployment:

```bash
curl https://your-domain.vercel.app/api/health
```

Response yang diharapkan:

```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T10:00:00.000Z"
}
```

## 📊 Monitoring & Logs

### View logs di Vercel:

```bash
vercel logs api/index.ts --follow
```

### Database connection logs:

Database connection manager akan log:
- `[Database] Koneksi berhasil diinisialisasi (reuse global connection)`
- `[Database] Health check failed: ...` (jika ada error)

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"

Solusi: `npm install dotenv`

### Error: "DATABASE_URL not found"

Solusi:
1. Set di Vercel environment variables
2. Rebuild/redeploy
3. Check di Vercel dashboard → Settings → Environment Variables

### Error: "Connection pool exhausted"

Solusi:
1. Reduce max concurrent requests di client
2. Increase pool size di Supabase (kalau bisa)
3. Check query optimization di server

### Koneksi timeout di Vercel

Solusi:
1. Vercel Functions timeout: 30 detik default
2. Untuk long-running queries: gunakan Vercel Pro (up to 60s)
3. Split large operations jadi lebih kecil

### CORS error

Solusi: CORS middleware sudah di-setup di handler, tapi kalau masih error:

```typescript
// Di vercel-handler.ts
app.use((req: Request, res: Response, next: express.NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Ubah dari "*" ke domain spesifik
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") res.status(200).end();
  else next();
});
```

## 🔒 Security Checklist

- ✅ Password di DATABASE_URL di-encode (`@` → `%40`)
- ✅ JWT_SECRET diset di env variables (bukan hardcoded)
- ✅ NODE_ENV=production di Vercel settings
- ✅ HTTPS force (default Vercel)
- ✅ CORS hanya allow origin yang sesuai

## 📈 Performance Tips

1. **Connection Reuse**: Sudah implemented di `db-connection.ts`
2. **Query Optimization**: Gunakan `.select()` untuk kolom spesifik (bukan `SELECT *`)
3. **Caching**: Tambahkan Redis jika perlu (optional)
4. **Bundle Size**: Monitor build size dengan `npm run build`

## 📚 Referensi

- [Vercel Functions Docs](https://vercel.com/docs/serverless-functions/introduction)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Supabase Connection Pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling-with-supabase)
- [tRPC Integration](https://trpc.io/docs/quickstart)
