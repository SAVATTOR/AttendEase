# 🚀 Quick Deployment Guide

Deploy your app in **15 minutes** so your client can test!

---

## ⚡ **Fast Track (15 minutes)**

### 1. Deploy Backend to Render (5 min)

1. Go to https://render.com → Sign up
2. **New** → **Web Service**
3. **Connect GitHub** (or deploy manually)
4. **Settings:**
   - **Name**: `attendance-backend`
   - **Root Directory**: `backend`
   - **Build**: `npm install && npm run prisma:generate`
   - **Start**: `npm start`
5. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=your-supabase-url
   JWT_SECRET=your-secret-key-min-64-chars
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=https://your-app.web.app
   ```
6. **Deploy** → Wait for URL (e.g., `https://attendance-backend.onrender.com`)

### 2. Deploy Frontend to Firebase (10 min)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (in project root)
firebase init hosting
# Select: Use existing project or create new
# Public directory: frontend/dist
# Single-page app: Yes

# Create production env file
cd frontend
# Create .env.production with:
# VITE_API_URL=https://your-backend.onrender.com/api
# VITE_SOCKET_URL=https://your-backend.onrender.com
# VITE_GOOGLE_MAPS_API_KEY=your-key

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### 3. Update Frontend with Backend URL

After getting backend URL from Render:
1. Update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
2. Rebuild and redeploy:
   ```bash
   cd frontend
   npm run build
   firebase deploy --only hosting
   ```

### 4. Share with Client! 🎉

You'll get a URL like: `https://your-project.web.app`

---

## 📋 **Checklist**

- [ ] Backend deployed to Render
- [ ] Backend URL obtained
- [ ] Frontend `.env.production` created
- [ ] Frontend built
- [ ] Frontend deployed to Firebase
- [ ] Tested login
- [ ] Tested QR code
- [ ] Shared URL with client

---

## 🔧 **Environment Variables Reference**

### Backend (Render):
```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-minimum-64-characters-long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-app.web.app
```

### Frontend (.env.production):
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_GOOGLE_MAPS_API_KEY=your-key
```

---

## 🐛 **Common Issues**

**Backend not starting?**
- Check environment variables
- Verify DATABASE_URL
- Check Render logs

**Frontend can't connect?**
- Verify CORS_ORIGIN matches Firebase URL
- Check VITE_API_URL in .env.production
- Rebuild after changing env vars

**QR code not working?**
- Check WebSocket connection
- Verify backend is running
- Check browser console

---

## 💡 **Pro Tips**

1. **Test locally first** with production build
2. **Use Render free tier** for testing
3. **Firebase is free** for hosting
4. **Keep backend running** during client testing
5. **Monitor Render logs** for errors

---

**That's it! Your client can now test without code access!** 🎉

