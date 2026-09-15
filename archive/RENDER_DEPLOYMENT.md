# 🚀 Backend Deployment to Render

## Quick Deploy Steps

### 1. Go to Render
- Visit: https://render.com
- Sign up/Login (free tier available)

### 2. Create New Web Service
- Click **"New"** → **"Web Service"**
- Connect your GitHub repository
- Or use **"Manual Deploy"**

### 3. Configure Service

**Basic Settings:**
- **Name**: `attendance-backend`
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)

**Build & Start:**
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run prisma:generate`
- **Start Command**: `npm start`

### 4. Environment Variables

Add these in Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=your-supabase-database-url
JWT_SECRET=your-secure-jwt-secret-minimum-64-characters-long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://attendance-system-9178.web.app
```

**Important:**
- Get `DATABASE_URL` from Supabase project settings
- Generate a strong `JWT_SECRET` (64+ characters)
- Update `CORS_ORIGIN` with your Firebase URL after frontend deployment

### 5. Deploy
- Click **"Create Web Service"**
- Wait for deployment (5-10 minutes)
- Get your backend URL (e.g., `https://attendance-backend.onrender.com`)

### 6. Update Frontend
After getting backend URL, update `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

Then rebuild and redeploy frontend.

---

## Alternative: Use render.yaml

If you have `render.yaml` in your repo:
1. Render will auto-detect it
2. Fill in environment variables in dashboard
3. Deploy automatically

---

## Free Tier Notes

- **Spins down** after 15 minutes of inactivity
- **First request** may be slow (cold start)
- **Upgrade** to paid for always-on

---

## Troubleshooting

**Build fails?**
- Check Node version (needs 18+)
- Verify Prisma generate runs
- Check build logs

**Service won't start?**
- Verify DATABASE_URL is correct
- Check PORT is 10000
- Review startup logs

**CORS errors?**
- Update CORS_ORIGIN with exact Firebase URL
- Include protocol (https://)
- No trailing slash

