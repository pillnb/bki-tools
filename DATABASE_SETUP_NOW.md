# 🔧 Database Connection Setup - FINAL CHECKLIST

## ⚠️ Current Status
- ✅ **Pages load** (routing working)
- ❌ **Database queries fail** (no data showing)
- 🔴 **Root Cause:** `DATABASE_URL` not in Vercel environment

---

## 🎯 EXACTLY What to Do RIGHT NOW

### Option A: Via Vercel Dashboard UI (Easiest)

**Step 1: Get DATABASE_URL from Supabase**
```
1. Open: supabase.com → Your Project
2. Click: Settings → Database
3. Tab: "Connection Pooling"
4. Copy the entire URI (starts with postgresql://...)
   Example: postgresql://postgres:abcd1234@region-xxxxx.pooler.supabase.com:6543/postgres
```

**Step 2: Add to Vercel**
```
1. Open: vercel.com/dashboard → Your project
2. Click: Settings
3. Click: Environment Variables
4. Click: Add New
5. Fill:
   Name:  DATABASE_URL
   Value: (paste the URL from step 1)
6. Select: ☑️ Production ☑️ Preview ☑️ Development
7. Click: Save
```

**Step 3: Redeploy**
```
1. Go to: Deployments tab
2. Click: Redeploy (on latest commit)
3. Wait for "Deployment Complete"
4. Wait 2 more minutes for cache refresh
```

---

### Option B: Via Vercel CLI (If you prefer terminal)

```bash
# Make sure you're logged in
vercel auth

# Add the environment variable
vercel env add DATABASE_URL
# Paste the URL when prompted

# Redeploy
vercel redeploy

# Check logs
vercel logs --follow
```

---

## 🧪 After Redeploying (Wait 3-5 Minutes)

### Test 1: Health Check
```bash
curl https://YOUR_DOMAIN.vercel.app/api/health
```

Expected:
```json
{
  "status": "healthy",
  "message": "...",
  "timestamp": "2024-11-11T..."
}
```

If shows `"status": "unhealthy"` → Database connection still failing

---

### Test 2: Check Tools Page
```
1. Open: https://YOUR_DOMAIN.vercel.app/tools
2. Should see: List of tools from database
3. Console (F12): No red errors
```

---

### Test 3: Check Vercel Logs
```bash
vercel logs --follow

# Look for these lines:
[Database] Koneksi berhasil diinisialisasi (reuse global connection) ✅
# OR
[Database] DATABASE_URL tidak ditemukan ❌
[Database] Gagal menginisialisasi koneksi ❌
```

---

## ⚠️ Common Mistakes

| ❌ Wrong | ✅ Correct |
|---------|-----------|
| Port 5432 | Port **6543** (Transaction pooler) |
| Connection Pooler URL | **Transaction Pooler** URL |
| Only set Production | Set **all three**: Production, Preview, Development |
| Commit DATABASE_URL | Never commit — use environment variables only |
| Redeploy immediately | Wait for env var to **save first**, then redeploy |

---

## 📋 Verification Checklist

After adding DATABASE_URL:

- [ ] DATABASE_URL copied from Supabase Transaction Pooler
- [ ] URL format: `postgresql://postgres:PASSWORD@region-xxxxx.pooler.supabase.com:6543/postgres`
- [ ] Added to Vercel → Settings → Environment Variables
- [ ] Name: `DATABASE_URL` (exactly)
- [ ] Value: full PostgreSQL URL
- [ ] Selected: Production, Preview, Development
- [ ] Clicked: Save
- [ ] Redeployed (or waited for auto-redeploy)
- [ ] Deployment shows "Complete"
- [ ] Waited 2-3 minutes
- [ ] Tested /api/health → shows "healthy"
- [ ] Tested /tools → shows data from database
- [ ] Console → no errors

---

## 🔍 Troubleshooting

### Symptom: Still "unhealthy" or no data

**Check 1: Verify Variable Exists**
```bash
vercel env ls --prod
# Should show DATABASE_URL in the list
```

**Check 2: Verify Variable Format**
```bash
vercel env pull
# Verify .env.local has DATABASE_URL with full connection string
```

**Check 3: Check Logs for Connection Error**
```bash
vercel logs --follow
# Look for specific error messages:
# - "Connection refused" → URL wrong or port blocked
# - "authentication failed" → Password wrong
# - "database does not exist" → Database name wrong
```

**Check 4: Test Connection Locally**
```bash
# Try connecting with psql (if installed)
psql "postgresql://postgres:YOUR_PASSWORD@region-xxxxx.pooler.supabase.com:6543/postgres"
# If this fails → your connection string is wrong
# If succeeds → issue is in Vercel environment
```

**Check 5: Force New Deployment**
```bash
# Sometimes Vercel needs a fresh build
git commit --allow-empty -m "Trigger redeploy"
git push
# New deployment should pick up env variables
```

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `DATABASE_QUICK_FIX.md` | One-page quick fix |
| `DATABASE_CONNECTION_FIX.md` | Detailed troubleshooting |
| `.env.production.example` | Environment variable template |
| `server/_core/db-connection.ts` | Connection manager code |
| `server/_core/env.ts` | Environment config |

---

## 🚀 Expected Timeline

```
NOW:          Add DATABASE_URL to Vercel
↓ 1 minute    Vercel saves variable
↓ 2 minutes   Vercel redeploys
↓ 3 minutes   Build completes
↓ 5 minutes   Total → App works with database ✅
```

---

## ✅ Success Indicators

When database is connected properly:

1. ✅ `/api/health` returns `"status": "healthy"`
2. ✅ Tools page shows list of tools
3. ✅ Stock page shows inventory
4. ✅ All pages load data without console errors
5. ✅ Vercel logs show: `[Database] Koneksi berhasil`

---

## 🎯 Next Action

👉 **Go to Vercel Dashboard RIGHT NOW and add DATABASE_URL**

**Link:** https://vercel.com/dashboard → Your project → Settings → Environment Variables

---

Once DATABASE_URL is set and deployed:
- Database queries will work ✅
- All pages will show data ✅
- App is fully functional ✅

**Questions?** Check the detailed guide: `DATABASE_CONNECTION_FIX.md`
