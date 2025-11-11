# Arsitektur Vercel Serverless dengan Drizzle ORM

## 📐 Arsitektur

```
┌──────────────────────────────────────────────────────────────────┐
│                    VERCEL FUNCTIONS (Edge)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  api/index.ts (Entry Point)                                      │
│      ↓                                                             │
│  server/_core/vercel-handler.ts (Express App)                   │
│      ├─ /api/trpc → tRPC Handler (appRouter)                    │
│      ├─ /api/oauth/callback → OAuth routes                      │
│      ├─ /api/health → Health check                              │
│      └─ Error handlers                                           │
│      ↓                                                             │
│  server/_core/db-connection.ts (Global Connection Manager)      │
│      │                                                             │
│      └─ postgres client (reused globally)                        │
│         └─ drizzle-orm (Postgres-js adapter)                    │
│            └─ Global cache (getDbConnection)                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                          ↓↓↓
┌──────────────────────────────────────────────────────────────────┐
│              SUPABASE POSTGRESQL + PGBOUNCER                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  db.pooler.supabase.com:6543 (Connection Pooler)               │
│      ├─ Transaction pooling mode                                 │
│      ├─ Max 10 connections/app                                   │
│      ├─ 60s idle timeout                                         │
│      └─ Automatically manages connection lifecycle               │
│                                                                  │
│  tables: users, tools, stockItems, borrowings, approvals, ...  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

```
Browser Request
      ↓
   Vercel CDN (if static, cached)
      ↓
   Vercel Functions Runtime
      ↓
   api/index.ts (entry point)
      ↓
   vercel-handler.ts (Express app)
      ↓
   ┌─ tRPC middleware → appRouter
   ├─ OAuth routes
   └─ Health check
      ↓
   Server-side functions (server/db.ts, routers.ts)
      ↓
   db-connection.ts: getDbConnection()
      ↓
   ┌─ First request? Create new postgres client
   └─ Subsequent? Reuse global cached connection
      ↓
   postgres@db.pooler.supabase.com:6543
      ↓
   Execute query via drizzle-orm
      ↓
   Response back through middleware
      ↓
   Browser
```

## 🔌 Connection Pooling Strategy

### Problem di Vercel
- Setiap function execution bisa spawn handler baru
- Koneksi database tidak persistent antar executions
- Multiple handlers = multiple connections = pool exhaustion

### Solution: Global Reuse Pattern

```typescript
// server/_core/db-connection.ts

let globalDb = null;  // ← Reused across requests

export async function getDbConnection() {
  if (globalDb) return globalDb;  // ← Reuse if exists
  
  // Create new connection only if needed
  globalDb = drizzle(postgres(DATABASE_URL));
  return globalDb;
}
```

### Benefit
- ✅ Same handler instance = same connection
- ✅ No connection pool exhaustion
- ✅ Efficient resource usage
- ✅ Faster response times (no reconnect overhead)

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Compute** | Vercel Functions | Serverless execution |
| **Framework** | Express.js | HTTP server |
| **RPC** | tRPC | End-to-end type safety |
| **ORM** | Drizzle ORM | Type-safe database |
| **Driver** | postgres | Native PostgreSQL driver |
| **Database** | Supabase PostgreSQL | Managed PostgreSQL |
| **Pool** | pgBouncer (6543) | Connection pooling |
| **Frontend** | React + Vite | UI framework |

## 📁 Files Structure

```
project/
├── api/
│   └── index.ts                    ← Vercel Functions entry point
│
├── server/
│   ├── _core/
│   │   ├── index.ts                ← Dev server (localhost)
│   │   ├── context.ts              ← tRPC context
│   │   ├── db-connection.ts         ← Global DB connection manager ← NEW
│   │   ├── vercel-handler.ts        ← Express handler (no listen) ← NEW
│   │   ├── oauth.ts                ← OAuth routes
│   │   ├── env.ts                  ← Environment config
│   │   └── ...
│   ├── db.ts                       ← Database functions
│   └── routers.ts                  ← tRPC routers
│
├── client/
│   └── src/
│       └── ...
│
├── drizzle/
│   ├── schema.ts                   ← Database schema
│   ├── migrations/
│   └── ...
│
├── .env                            ← Dev environment
├── .env.production.example         ← Production template ← NEW
├── vercel.json                     ← Vercel config ← NEW
├── VERCEL_DEPLOYMENT.md            ← Full documentation ← NEW
└── VERCEL_QUICKSTART.md            ← Quick start guide ← NEW
```

## 🔐 Security Features

### 1. Global Connection Reuse
- Menghindari connection leak
- Mencegah pool exhaustion
- Efficient resource management

### 2. Environment Variables
- DATABASE_URL (encoded password)
- JWT_SECRET
- NODE_ENV (production)
- BASE_URL

### 3. CORS Handling
- Middleware setup di handler
- Allow multiple origins
- Credentials support

### 4. Error Handling
- Graceful error responses
- Connection error recovery
- Health check endpoint

## 📊 Performance Characteristics

| Metric | Local Dev | Vercel Production |
|--------|-----------|-------------------|
| **Cold Start** | N/A | ~1-2s (first deploy) |
| **Warm Start** | <10ms | ~50-100ms |
| **Connection Pool** | Single | Global (reused) |
| **Max Concurrency** | Limited by port | Limited by Vercel plan |
| **Query Timeout** | None | 30s (Pro: 60s) |
| **Memory** | Unlimited | 512MB (configurable) |

## 🚀 Deployment Flow

### Development
```
npm run dev
  ↓
server/_core/index.ts (localhost:3000)
  ↓
app.listen(3000)
```

### Production (Vercel)
```
git push
  ↓
Vercel detects change
  ↓
Runs "build" command: vite build
  ↓
Builds frontend to dist/
  ↓
api/index.ts automatically detected
  ↓
Wraps in Vercel Functions
  ↓
Deployed to edge network
  ↓
Ready to serve requests
```

## 🔄 Environment Configuration

### .env (Development)
```
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
JWT_SECRET=dev-secret
```

### Vercel Environment Variables (Production)
```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:pass%40@db.pooler.supabase.com:6543/postgres
JWT_SECRET=<generate-random>
BASE_URL=https://myapp.vercel.app
VITE_API_URL=https://myapp.vercel.app/api/trpc
```

## ✅ Deployment Readiness Checklist

- [x] Express app doesn't call `app.listen()`
- [x] Global connection reuse implemented
- [x] Drizzle ORM configured for PostgreSQL
- [x] Supabase connection pooler (port 6543)
- [x] Environment variables documented
- [x] CORS middleware setup
- [x] Health check endpoint
- [x] Error handling
- [x] Vercel config (vercel.json)
- [x] API entry point (api/index.ts)
- [x] Documentation (VERCEL_DEPLOYMENT.md)

## 🎯 Next Steps

1. **Update environment variables** in Vercel dashboard
2. **Test locally**: `npm run dev` and `npm run build`
3. **Deploy**: Push to GitHub or use `vercel --prod`
4. **Verify**: Check `/api/health` endpoint
5. **Monitor**: View logs in Vercel dashboard

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Drizzle Docs: https://orm.drizzle.team/
- Supabase Docs: https://supabase.com/docs
- tRPC Docs: https://trpc.io/docs

---

**Created**: November 2025  
**Status**: Ready for production deployment ✅
