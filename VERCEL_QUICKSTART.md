# 🚀 Quick Start: Deploy ke Vercel

## Langkah Cepat (5 menit)

### 1. Siapkan Environment Variables

Di Supabase dashboard, dapatkan connection pooler URL:
- **Host**: `db.pooler.supabase.com`
- **Port**: `6543`
- **Database**: `postgres`
- **User**: `postgres`

Contoh DATABASE_URL:
```
postgresql://postgres:MyPassword%40123@db.pooler.supabase.com:6543/postgres?schema=public
```

**PENTING**: 
- Encode password jika ada `@` (ubah ke `%40`)
- Gunakan Connection Pooler, bukan direct connection

### 2. Deploy ke Vercel

#### Via GitHub (Recommended)

```bash
# 1. Push ke GitHub
git add .
git commit -m "Setup Vercel deployment"
git push

# 2. Di Vercel dashboard:
# - Click "New Project"
# - Select repo Anda
# - Di "Environment Variables", add:
#   - DATABASE_URL
#   - JWT_SECRET (buat random string 32+ chars)
# - Click "Deploy"
```

#### Via Vercel CLI

```bash
npm install -g vercel

vercel \
  --env DATABASE_URL="postgresql://..." \
  --env JWT_SECRET="$(openssl rand -base64 32)" \
  --prod
```

### 3. Verifikasi Deployment

```bash
# Check health
curl https://your-app.vercel.app/api/health

# Response:
# { "status": "healthy", "timestamp": "2025-11-11T10:00:00.000Z" }
```

## Struktur Files yang Sudah Siap

```
✅ server/_core/db-connection.ts     - Global connection manager
✅ server/_core/vercel-handler.ts    - Express handler (no listen)
✅ api/index.ts                       - Vercel Functions entry point
✅ vercel.json                        - Vercel config
✅ .env.production.example            - Environment template
✅ VERCEL_DEPLOYMENT.md              - Dokumentasi lengkap
```

## Environment Variables di Vercel

Settings → Environment Variables, tambahkan:

| Key | Value | Contoh |
|-----|-------|--------|
| `DATABASE_URL` | Supabase pgBouncer URL | `postgresql://postgres:pass%40@db.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | Random string 32+ chars | `abc123...xyz` |
| `NODE_ENV` | `production` | `production` |
| `BASE_URL` | Domain Vercel | `https://myapp.vercel.app` |

## 🔄 Connection Reuse Mechanism

Database connection **automatically reused** across requests:

```
Request 1 → getDbConnection() → Create connection → Cache globally
Request 2 → getDbConnection() → Reuse cached connection ✅
Request 3 → getDbConnection() → Reuse cached connection ✅
```

Keuntungan:
- ✅ No cold starts
- ✅ Efficient resource usage
- ✅ No connection pool exhaustion

## 📊 Monitoring

View logs di Vercel CLI:

```bash
vercel logs api/index.ts --follow
```

Atau di Vercel Dashboard → Deployments → View Logs

## 🐛 Common Issues & Fixes

### "DATABASE_URL is undefined"
→ Set di Vercel environment variables dan redeploy

### "Connection refused"
→ Check Supabase Connection Pooler (port 6543) is enabled

### "CORS error"
→ Already handled in handler, but check origin whitelist

### "Timeout (>30s)"
→ Vercel default timeout. Upgrade to Pro for longer, atau split operations

## ✅ Deployment Checklist

- [ ] Set `DATABASE_URL` in Vercel env
- [ ] Set `JWT_SECRET` in Vercel env  
- [ ] Set `NODE_ENV=production`
- [ ] Run `npm run build` locally (no errors)
- [ ] Test `/api/health` endpoint
- [ ] Test tRPC endpoints from frontend
- [ ] Check Vercel logs for errors
- [ ] Monitor database connection (in Supabase)

## 📚 Reference

- Files guide: see `VERCEL_DEPLOYMENT.md`
- Database config: `server/_core/db-connection.ts`
- Handler setup: `server/_core/vercel-handler.ts`
- Handler entry: `api/index.ts`

---

**Ready to deploy?**

```bash
git push   # If using GitHub integration
# or
vercel --prod   # If using CLI
```

Good luck! 🎉
