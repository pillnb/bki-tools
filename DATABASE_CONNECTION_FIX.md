# 🚨 Database Connection Issue - SOLUTION

## ❌ Problem
Database queries return empty results on Vercel (page loads but no data).

## ✅ Root Cause
`DATABASE_URL` environment variable is **NOT set in Vercel Dashboard**.

---

## 🔧 How to Fix (3 Easy Steps)

### Step 1: Get Your Database URL from Supabase

1. **Open Supabase**: https://supabase.com
2. **Select your project**
3. **Go to:** Settings → Database → Connection Info
4. **Copy the connection string:**
   - Select the **`Transaction pooler`** tab (important for serverless!)
   - Copy the URI that starts with: `postgresql://...@...pooler.supabase.com:6543/...`

**Example:**
```
postgresql://postgres:PASSWORD@region-12345.pooler.supabase.com:6543/postgres
```

⚠️ **IMPORTANT:**
- Use **port 6543** (pgBouncer pooler), NOT 5432
- Replace `[YOUR-PASSWORD]` with your actual password
- Make sure it ends with the database name

---

### Step 2: Add DATABASE_URL to Vercel

1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `bki-tools`
3. **Go to:** Settings → Environment Variables
4. **Click:** "Add New" or "Edit"
5. **Fill in:**
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:YOUR-PASSWORD@region-xxxxx.pooler.supabase.com:6543/postgres`
   - **Select Environments:** Check `Production`, `Preview`, and `Development`

6. **Click:** Save

---

### Step 3: Redeploy on Vercel

After adding the environment variable, trigger a new deployment:

**Option A: Automatic (wait 5 min)**
- Vercel auto-detects the environment variable change
- New deployment starts automatically

**Option B: Manual (faster)**
1. Go to Vercel Dashboard
2. Select project
3. Click: "Redeploy" (in Deployments tab)
4. Choose: Latest commit
5. Click: "Redeploy"

---

## 🧪 Verify It Works

After deployment completes (~2-3 min):

### Test 1: Health Check
```bash
curl https://your-app.vercel.app/api/health
```
**Expected Response:**
```json
{
  "status": "healthy",
  "message": "API Root - Health Check",
  "timestamp": "2024-11-11T..."
}
```

### Test 2: Database Query
Open app and check:
- Dashboard should show Tools ✅
- No "Database connection failed" errors ✅
- Console (F12) should be clean ✅

### Test 3: Full Flow
1. Open: `https://your-app.vercel.app/`
2. Go to: Tools page
3. Should see list of tools from database ✅

---

## 🐛 Troubleshooting

### Still No Data?

**Check 1: Environment Variable Set Correctly**
```bash
# Go to Vercel Dashboard → Settings → Environment Variables
# Verify DATABASE_URL is there and looks like:
# postgresql://postgres:...@region-xxxxx.pooler.supabase.com:6543/postgres
```

**Check 2: Check Vercel Logs**
```bash
# In terminal
vercel logs --follow

# Look for errors like:
# "[Database] DATABASE_URL tidak ditemukan"
# "[Database] Gagal menginisialisasi koneksi"
# "[Database] Connection refused"
```

**Check 3: Verify Database Exists**
```bash
# Test connection locally first
psql "postgresql://postgres:YOUR-PASSWORD@region-xxxxx.pooler.supabase.com:6543/postgres"

# If this works → database is reachable
# If fails → DATABASE_URL wrong or database down
```

**Check 4: Check Supabase Status**
- Visit: https://status.supabase.com
- Make sure service is online

---

## 📋 Environment Variable Checklist

- [ ] DATABASE_URL copied from Supabase (Transaction pooler URL)
- [ ] DATABASE_URL added to Vercel Environment Variables
- [ ] DATABASE_URL set for Production environment
- [ ] DATABASE_URL uses **port 6543** (not 5432)
- [ ] DATABASE_URL includes database name (usually `postgres`)
- [ ] Vercel redeployed after adding variable
- [ ] Vercel deployment shows "Deployment Complete"
- [ ] No "DATABASE_URL not found" errors in logs

---

## 🔐 Security Notes

- ✅ DATABASE_URL is secret (don't commit to git)
- ✅ Vercel encrypts environment variables
- ✅ Only backend can access DATABASE_URL
- ✅ Frontend never sees the URL

---

## 📖 Related Files

| File | Purpose |
|------|---------|
| `server/_core/db-connection.ts` | Database connection manager |
| `server/_core/env.ts` | Environment variable definitions |
| `.env.production.example` | Example of environment variables |
| `.gitignore` | Prevents .env from being committed |

---

## ✅ Expected Result After Fix

```
Frontend loads ✅
  ↓
Browser calls /api/trpc/tools.list
  ↓
Vercel receives request
  ↓
Express handler starts
  ↓
Database connection initialized with DATABASE_URL
  ↓
Query executed: SELECT * FROM tools
  ↓
Results returned as JSON
  ↓
React renders tools list
  ↓
User sees tools on page ✅
```

---

## 🚀 Next Steps

1. **Get DATABASE_URL from Supabase** ← Do this first!
2. **Add to Vercel Environment Variables**
3. **Redeploy on Vercel**
4. **Wait 2-3 minutes**
5. **Test: Open app and check Tools page**
6. **Done!** ✅

---

**Still having issues?**
- Check Vercel logs: `vercel logs --follow`
- Verify DATABASE_URL format
- Make sure Supabase is running
- Check if port 6543 is accessible from Vercel

