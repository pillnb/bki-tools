# Vercel Serverless Deployment - Summary

## ✅ Completed Setup

### Core Files Created
- `server/_core/db-connection.ts` - Global connection manager dengan reuse pattern
- `server/_core/vercel-handler.ts` - Express app tanpa `app.listen()` untuk Vercel Functions
- `api/index.ts` - Entry point untuk Vercel Functions
- `vercel.json` - Konfigurasi Vercel

### Documentation Created
- `VERCEL_DEPLOYMENT.md` - Panduan lengkap deployment
- `VERCEL_QUICKSTART.md` - Quick start guide (5 menit)
- `VERCEL_ARCHITECTURE.md` - Penjelasan arsitektur & tech stack

### Configuration Files
- `.env.production.example` - Template environment variables untuk production

### Updated Files
- `package.json` - Perbaikan build scripts

## 🔄 Connection Reuse Pattern (Serverless Safe)

```typescript
// Global variable (reused across requests)
let globalDb = null;

export async function getDbConnection() {
  if (globalDb) return globalDb;  // ← Reuse jika sudah ada
  
  // Create baru hanya jika perlu
  globalDb = drizzle(postgres(DATABASE_URL));
  return globalDb;
}
```

**Benefit:**
- ✅ Tidak ada koneksi baru setiap request
- ✅ Connection pool tidak exhausted
- ✅ Cold start time minimal
- ✅ Resource efficient

## 🚀 Deployment ke Vercel

### Langkah 1: Set Environment Variables
Di Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL = postgresql://postgres:pass%40@db.pooler.supabase.com:6543/postgres?schema=public
JWT_SECRET = (random string 32+ chars)
NODE_ENV = production
BASE_URL = https://your-app.vercel.app
```

**PENTING:** 
- Gunakan pgBouncer URL (port 6543), bukan direct connection
- Encode password: `@` → `%40`

### Langkah 2: Deploy
```bash
# Option 1: Via GitHub (Recommended)
git push origin main
# Vercel auto-deploys

# Option 2: Via CLI
vercel --prod
```

### Langkah 3: Verify
```bash
curl https://your-app.vercel.app/api/health

# Expected response:
# { "status": "healthy", "timestamp": "2025-11-11T..." }
```

## 📊 Architecture Overview

```
Frontend (React + Vite)
    ↓ (tRPC client)
Vercel Functions (api/index.ts)
    ↓ (Express middleware)
Express Handler (vercel-handler.ts)
    ↓ (Routes)
  - /api/trpc (tRPC endpoints)
  - /api/oauth/callback (OAuth)
  - /api/health (Health check)
    ↓ (getDbConnection)
Global Connection Manager (db-connection.ts)
    ↓ (Reused connection)
Supabase PostgreSQL + pgBouncer (port 6543)
```

## 🔌 Database Configuration

### Supabase Connection Pooler (Recommended)
- **Host:** `db.pooler.supabase.com`
- **Port:** `6543` (transaction pooling)
- **Max connections:** 10 per app
- **Idle timeout:** 60 seconds

### Connection String Format
```
postgresql://postgres:password%40@db.pooler.supabase.com:6543/postgres?schema=public
```

## ✅ Deployment Checklist

- [ ] Review `VERCEL_QUICKSTART.md` (5 min read)
- [ ] Set DATABASE_URL in Vercel env
- [ ] Set JWT_SECRET in Vercel env
- [ ] Confirm NODE_ENV=production
- [ ] Test build locally: `npm run build`
- [ ] Deploy: `git push` or `vercel --prod`
- [ ] Test endpoint: `curl /api/health`
- [ ] Check Vercel logs for errors
- [ ] Monitor database connections in Supabase

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `server/_core/db-connection.ts` | Global connection reuse |
| `server/_core/vercel-handler.ts` | Express handler (no listen) |
| `api/index.ts` | Vercel Functions entry |
| `vercel.json` | Vercel config |
| `VERCEL_DEPLOYMENT.md` | Full setup guide |
| `VERCEL_QUICKSTART.md` | 5-min quick start |
| `VERCEL_ARCHITECTURE.md` | Architecture docs |

## 🐛 Troubleshooting

### Error: "DATABASE_URL is undefined"
→ Add to Vercel environment variables and redeploy

### Error: "Connection refused"
→ Verify pgBouncer is enabled in Supabase (port 6543)

### Error: "CORS error"
→ CORS middleware sudah ada, check origin whitelist

### Timeout errors (>30s)
→ Vercel default 30s timeout. Split operations or upgrade to Pro

## 📈 Performance Tips

1. **Connection Reuse** - Already implemented ✅
2. **Query Optimization** - Use `.select(specific_columns)`
3. **Caching** - Consider Redis for frequently accessed data
4. **Bundle Size** - Monitor with `npm run build`

## 🎯 Next Steps

1. Review `VERCEL_QUICKSTART.md`
2. Set environment variables in Vercel
3. Deploy: `git push` or `vercel --prod`
4. Verify with health check
5. Monitor & iterate

## 📚 Documentation Files

- **VERCEL_QUICKSTART.md** ← Start here! (5 minutes)
- **VERCEL_DEPLOYMENT.md** ← Detailed guide (30 minutes)
- **VERCEL_ARCHITECTURE.md** ← Technical deep dive

---

**Status:** ✅ Ready for production deployment

**Last Updated:** November 11, 2025
