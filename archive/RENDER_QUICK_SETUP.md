# 🚀 Render Quick Setup Guide

## ✅ **What to Choose on Render**

### Step 1: Click "Add new" → Select **"Web Service"**

**Why Web Service?**
- ✅ Perfect for Node.js backend APIs
- ✅ Handles HTTP requests
- ✅ Supports WebSockets (Socket.io)
- ✅ Free tier available

**NOT these:**
- ❌ Static Site - Only for frontend (HTML/CSS/JS)
- ❌ Background Worker - For scheduled tasks
- ❌ Postgres - Database (you're using Supabase)

---

## 📋 **Complete Setup Steps**

### Step 2: Connect Repository
- **Option A**: Connect GitHub (recommended)
  - Click "Connect GitHub"
  - Authorize Render
  - Select your repository
  - Select branch (usually `main` or `master`)

- **Option B**: Public Git repository
  - Paste your Git repository URL

- **Option C**: Manual Deploy
  - Upload files manually (not recommended)

---

### Step 3: Configure Service

**Basic Settings:**
- **Name**: `attendance-backend` (or any name you like)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` ⚠️ **IMPORTANT!**

**Build & Start:**
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  npm install && npm run prisma:generate
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

---

### Step 4: Environment Variables

Click **"Advanced"** → **"Environment Variables"** → Add these:

```
NODE_ENV = production
PORT = 10000
DATABASE_URL = your-supabase-database-url
JWT_SECRET = your-secure-secret-minimum-64-characters-long
JWT_EXPIRES_IN = 7d
CORS_ORIGIN = https://attendance-system-9178.web.app
```

**How to get DATABASE_URL:**
1. Go to Supabase Dashboard
2. Project Settings → Database
3. Copy "Connection string" (URI format)
4. It looks like: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

**How to generate JWT_SECRET:**
```bash
# Run this in terminal to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Watch the build logs
4. When done, you'll get a URL like: `https://attendance-backend.onrender.com`

---

## ✅ **Configuration Summary**

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Name** | attendance-backend |
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run prisma:generate` |
| **Start Command** | `npm start` |
| **Port** | `10000` (set in env var) |

---

## 🎯 **Visual Guide**

```
Render Dashboard
├── Click "Add new"
├── Select "Web Service" ← CHOOSE THIS!
│
├── Connect Repository
│   ├── Connect GitHub (recommended)
│   └── Select your repo
│
├── Configure
│   ├── Name: attendance-backend
│   ├── Root Directory: backend ← IMPORTANT!
│   ├── Build: npm install && npm run prisma:generate
│   └── Start: npm start
│
├── Environment Variables
│   ├── NODE_ENV = production
│   ├── PORT = 10000
│   ├── DATABASE_URL = (from Supabase)
│   ├── JWT_SECRET = (generate secure secret)
│   ├── JWT_EXPIRES_IN = 7d
│   └── CORS_ORIGIN = https://attendance-system-9178.web.app
│
└── Deploy → Get URL
```

---

## ⚠️ **Important Notes**

1. **Root Directory**: Must be `backend` (not root of repo)
2. **Build Command**: Must include `prisma:generate` for Prisma to work
3. **Port**: Render sets PORT automatically, but we use 10000
4. **CORS_ORIGIN**: Must match your Firebase URL exactly

---

## 🐛 **Common Mistakes**

❌ **Wrong**: Root Directory = `.` (root)
✅ **Correct**: Root Directory = `backend`

❌ **Wrong**: Build Command = `npm install`
✅ **Correct**: Build Command = `npm install && npm run prisma:generate`

❌ **Wrong**: Start Command = `node server.js`
✅ **Correct**: Start Command = `npm start`

---

## 📝 **After Deployment**

Once deployed, you'll get a URL like:
```
https://attendance-backend.onrender.com
```

**Then update frontend:**
1. Edit `frontend/.env.production`
2. Set `VITE_API_URL=https://your-backend.onrender.com/api`
3. Set `VITE_SOCKET_URL=https://your-backend.onrender.com`
4. Rebuild: `cd frontend && npm run build`
5. Redeploy: `firebase deploy --only hosting`

---

## 💡 **Pro Tips**

1. **Free Tier**: Spins down after 15 min inactivity (first request may be slow)
2. **Logs**: Check logs if deployment fails
3. **Health Check**: Render will ping your service
4. **Auto-Deploy**: Enabled by default (deploys on git push)

---

**That's it! Choose "Web Service" and follow the steps above!** 🚀

