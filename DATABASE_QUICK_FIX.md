# 🔴 Database Not Connected - QUICK FIX

## ❌ What's Happening

```
✅ Page loads (Vercel routing working)
✅ UI displays
❌ Database queries fail
❌ No data showing (tools list empty)
```

## ✅ Why & How to Fix

### The Problem
```
DATABASE_URL environment variable is NOT set in Vercel Dashboard
↓
Vercel Functions can't connect to Supabase
↓
All database queries fail silently
```

### The Solution (3 Steps)

#### Step 1️⃣: Get DATABASE_URL
From Supabase:
1. Go to: https://supabase.com → Your Project
2. Settings → Database → Connection Info
3. Copy the **Transaction pooler** URL (port **6543**)
4. Format: `postgresql://postgres:PASSWORD@region-xxxxx.pooler.supabase.com:6543/postgres`

#### Step 2️⃣: Add to Vercel
1. Go to: https://vercel.com/dashboard → Your Project
2. Settings → Environment Variables
3. Click "Add New"
4. Name: `DATABASE_URL`
5. Value: (paste from step 1)
6. Select: Production + Preview + Development
7. Click: Save

#### Step 3️⃣: Redeploy
In Vercel Dashboard → Deployments → Click "Redeploy" (or wait auto-redeploy)

---

## 🧪 Test After 2-3 Minutes

```bash
# Test health (should show "healthy")
curl https://your-app.vercel.app/api/health

# Test in browser (should show tools from DB)
https://your-app.vercel.app/tools
```

---

## 📋 Checklist

- [ ] DATABASE_URL copied from Supabase (Transaction pooler, port 6543)
- [ ] DATABASE_URL added to Vercel Environment Variables
- [ ] Set for Production environment
- [ ] Vercel redeployed or auto-redeploy in progress
- [ ] Waited 2-3 minutes
- [ ] Tested /api/health endpoint
- [ ] Tested /tools page shows data

---

## 🔍 If Still Not Working

### Check Vercel Logs
```bash
vercel logs --follow
```

Look for:
```
[Database] DATABASE_URL tidak ditemukan  ← Missing variable
[Database] Connection refused            ← Wrong URL or firewall
[Database] Koneksi berhasil              ← Working!
```

### Verify DATABASE_URL Format
- Starts with: `postgresql://`
- Port: `:6543` (Transaction pooler, NOT 5432)
- Includes: `@region-xxxxx.pooler.supabase.com`
- Ends with: `/postgres` (database name)

### Test Locally
```bash
# Verify it's a valid connection string
psql "postgresql://postgres:PASSWORD@region-xxxxx.pooler.supabase.com:6543/postgres"
```

---

## 💡 Key Points

✅ **Transaction Pooler (port 6543)** required for serverless
✅ **Production** environment variable selected
✅ **Full URL** including password (Vercel encrypts it)
✅ **Wait 2-3 min** for redeploy to complete

❌ Don't use **Connection Pooler** (port 6380) - it's different
❌ Don't use **Direct connection** (port 5432) - won't work on serverless
❌ Don't forget **password** in the URL
❌ Don't redeploy without **waiting** for environment to save

---

## 📞 Support

**Detailed guide:** See `DATABASE_CONNECTION_FIX.md`

**Environment template:** See `.env.production.example`

**Connection manager:** See `server/_core/db-connection.ts`

---

🚀 **After adding DATABASE_URL and redeploying, everything should work!**
