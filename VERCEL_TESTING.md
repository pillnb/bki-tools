# Vercel Deployment Testing Checklist

## 📋 Overview
Testing guide untuk memverifikasi bahwa 404 NOT_FOUND error sudah fixed setelah routing structure update.

**Error ID yang di-resolve:** `sin1::9btst-1762836569384-f8187226dcd5`

## 🔍 Pre-Deployment Checks (Already Done ✓)

- [x] Build berhasil tanpa errors: `npm run build`
- [x] TypeScript type checking passed
- [x] Git commit dengan deskripsi perubahan
- [x] Push ke GitHub (triggers Vercel auto-deploy)

## ⏳ Deployment Status (Wait 2-3 minutes)

Monitor Vercel deployment:
1. Visit: https://vercel.com/dashboard
2. Select project: `bki-tools`
3. Wait untuk "Deployment Complete" status
4. Deployment biasanya selesai dalam 2-3 menit

## 🧪 Testing Steps (After Deployment Complete)

### 1. Test Health Endpoint
```bash
# Browser
https://your-vercel-domain.vercel.app/api/health

# Or curl
curl https://your-vercel-domain.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-11-XX..."
}
```

**If Error:**
- 404: Catch-all route file `api/[[...slug]].ts` tidak loading
- 500: Database connection gagal, check DATABASE_URL environment variable

---

### 2. Test tRPC Endpoint
```bash
# Browser (akan melihat tRPC POST interface)
https://your-vercel-domain.vercel.app/api/trpc

# Or curl untuk test actual call
curl -X POST https://your-vercel-domain.vercel.app/api/trpc/tools.list \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
- tRPC POST interface atau hasil tools list (array)

**If Error:**
- 404: Express routes tidak mounting dengan benar
- 500: tRPC router error atau database connection error

---

### 3. Test Frontend Load
```
https://your-vercel-domain.vercel.app/
```

**Expected Behavior:**
- Dashboard loads tanpa error
- Network tab di DevTools menunjukkan `/api/health` return 200
- tRPC calls menunjukkan 200 status (bukan 404)

**To Check in Browser DevTools:**
1. F12 → Network tab
2. Reload page
3. Filter by "api"
4. Should see:
   - `/api/health` → 200
   - `/api/trpc?...` → 200 (atau fetch batch calls)

---

### 4. Test tRPC Mutations (Create Tool)
```
1. Login ke dashboard
2. Navigate ke Tools page
3. Click "Tambah Tool"
4. Fill form & submit
```

**Expected Behavior:**
- Tool berhasil dibuat di database
- No 404 errors dalam console
- Vercel logs menunjukkan tRPC handler merespon

**To Check Logs:**
```bash
vercel logs api/[[...slug]].ts --follow
```

---

### 5. Test OAuth Callback (Jika perlu)
```
https://your-vercel-domain.vercel.app/api/oauth/callback?code=...&state=...
```

**Expected:**
- Redirect ke dashboard (jika valid)
- Atau error message (jika invalid)
- Tidak 404 NOT_FOUND

---

## 🐛 Troubleshooting If 404 Still Occurs

### Check 1: Verify File Structure Deployment
```bash
# Files yang harus ada di Vercel:
# ✓ api/[[...slug]].ts      - Catch-all handler
# ✓ api/index.ts           - Root /api handler
# ✓ vercel.json            - Config dengan "functions": {"api/**/*.ts": ...}
```

**To Verify:**
```bash
vercel ls --prod
```

### Check 2: Verify Environment Variables
```bash
# Pastikan ini set di Vercel Dashboard → Settings → Environment Variables:
DATABASE_URL=postgresql://...@region-X.pooler.supabase.com:6543/...
JWT_SECRET=your-secret
```

**To Check:**
```bash
vercel env ls --prod
```

### Check 3: Check Vercel Logs
```bash
# Real-time logs
vercel logs --follow

# Or untuk specific function
vercel logs api/[[...slug]].ts --follow
```

**Look for:**
- Express app initialization errors
- Database connection errors
- Route mounting errors

### Check 4: Test Locally First
```bash
# Simulate Vercel environment locally
npm run dev

# Test dalam browser
http://localhost:5173/
```

**If works locally but not on Vercel:**
- Environment variables mungkin salah
- Database connection pooler config mungkin tidak compatible

---

## ✅ Success Indicators

| Aspect | Status | Check |
|--------|--------|-------|
| Health Endpoint | ✓ | `/api/health` returns 200 |
| tRPC Endpoint | ✓ | `/api/trpc` accepts POST |
| Frontend | ✓ | Loads without 404 in console |
| Database | ✓ | Can create/read tools |
| OAuth | ✓ | Login flow works |
| Environment | ✓ | All vars set in Vercel |

---

## 📝 Files Modified

Changed dalam ini deployment fix:

1. **`api/[[...slug]].ts`** - NEW
   - Catch-all route handler untuk semua `/api/*` requests
   - Delegates ke Express handler

2. **`api/index.ts`** - MODIFIED
   - Now only handles root `/api` endpoint
   - Returns 404 untuk non-root paths (caught by [[...slug]].ts)

3. **`vercel.json`** - MODIFIED
   - Simplified dari complex rewrite rules
   - Now: `"functions": {"api/**/*.ts": {"memory": 512, "maxDuration": 30}}`

4. **`server/_core/vercel-handler.ts`** - MODIFIED
   - Routes updated dari `/api/trpc` → `/trpc` (relative)
   - Routes updated dari `/api/health` → `/health` (relative)
   - Express akan mounting di `/api/*` level karena file structure

---

## 🚀 Next Steps If Successful

- [ ] All tests passing
- [ ] Document testing results
- [ ] Commit testing documentation (if needed)
- [ ] Monitor Vercel logs untuk errors dalam 24 hours
- [ ] Setup error monitoring (e.g., Sentry) untuk production

---

## 📞 Support / Debugging

Jika masih mengalami 404:

1. Check actual error message dalam Vercel logs
2. Verify environment variables set correctly
3. Check if Express app initializing properly
4. Verify database connection working
5. Test with minimal API endpoint first (just /api/health)

---

**Last Updated:** Generated during Vercel routing fix deployment (commit: 9bc49e6)
**Status:** Ready for testing after Vercel deployment completes
