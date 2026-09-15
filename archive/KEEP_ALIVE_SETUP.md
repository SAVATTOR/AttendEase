# 🔄 Keep-Alive Setup for Render Service

## 🎯 **Problem**

Render free tier spins down services after **15 minutes** of inactivity. This causes:
- Slow first request (~30 seconds cold start)
- Poor user experience
- Service appears "down"

## ✅ **Solution: Supabase Edge Function + Cron Job**

### Step 1: Edge Function Created ✅

I've created a Supabase Edge Function called `keep-alive` that pings your backend every time it's called.

**Function URL**: `https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive`

---

## 🔧 **Step 2: Set Up Cron Job (Choose One Method)**

### **Option A: Using cron-job.org (Easiest - Recommended)**

1. **Go to**: https://cron-job.org (free)
2. **Sign up** (free account)
3. **Create Cronjob**:
   - **Title**: `Keep Render Service Alive`
   - **Address**: `https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive`
   - **Schedule**: Every **14 minutes** (`*/14 * * * *`)
   - **Request Method**: `GET`
   - **Activate**: ✅ Yes
4. **Save** → Done!

**That's it!** Your service will be pinged every 14 minutes automatically.

---

### **Option B: Using GitHub Actions (Free, No External Service)**

Create `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Render Service Alive

on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
  workflow_dispatch:  # Manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -X GET https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive
```

**Benefits**: Free, no external service needed, runs automatically.

---

### **Option C: Using Supabase Database Function (Advanced)**

Create a database function that calls the Edge Function:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the keep-alive function
SELECT cron.schedule(
  'keep-render-alive',
  '*/14 * * * *',  -- Every 14 minutes
  $$
  SELECT net.http_get(
    url := 'https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive',
    headers := '{"Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Note**: Requires `pg_cron` extension (may need Supabase support to enable).

---

## 🎯 **Recommended: Option A (cron-job.org)**

**Why?**
- ✅ Easiest setup (2 minutes)
- ✅ Free forever
- ✅ Reliable
- ✅ No code changes needed
- ✅ Can monitor execution

---

## 📋 **Quick Setup (cron-job.org)**

1. Visit: https://cron-job.org
2. Sign up (free)
3. Click **"Create cronjob"**
4. Fill in:
   ```
   Title: Keep Render Service Alive
   Address: https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive
   Schedule: */14 * * * *
   ```
5. Click **"Create"**
6. **Done!** ✅

---

## 🧪 **Test the Edge Function**

Test it manually:

```bash
curl https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive
```

Expected response:
```json
{
  "success": true,
  "message": "Backend pinged successfully",
  "backendStatus": {
    "success": true,
    "message": "API is running",
    "uptime": 123.45
  },
  "timestamp": "2025-12-24T18:57:35.909Z"
}
```

---

## 📊 **How It Works**

```
Every 14 minutes:
  cron-job.org
    ↓
  Calls Supabase Edge Function
    ↓
  Edge Function pings Render backend
    ↓
  Render service stays awake! ✅
```

---

## ⚙️ **Edge Function Details**

**Location**: `supabase/functions/keep-alive/index.ts`

**What it does**:
1. Receives HTTP request
2. Calls `https://attendance-backend-9m05.onrender.com/api/health`
3. Returns success/failure status
4. Logs timestamp

**Security**: 
- No JWT verification (public endpoint)
- Only pings health endpoint (read-only)
- Safe to expose publicly

---

## 🔍 **Monitor Keep-Alive**

### Check Edge Function Logs:
1. Go to Supabase Dashboard
2. Edge Functions → `keep-alive`
3. View logs

### Check Render Logs:
1. Go to Render Dashboard
2. Your service → Logs
3. You'll see health check requests every 14 minutes

---

## 💡 **Pro Tips**

1. **14 minutes**: Render spins down after 15 min, so 14 min keeps it alive
2. **Health Endpoint**: Uses `/api/health` (lightweight, fast)
3. **Free**: All solutions are free
4. **Monitoring**: Check logs weekly to ensure it's working

---

## 🎯 **After Setup**

Once cron job is active:
- ✅ Service stays awake 24/7
- ✅ No cold starts
- ✅ Fast response times
- ✅ Better user experience

---

## 📝 **Quick Reference**

- **Edge Function URL**: `https://rdjivkefulmocxyfmxyu.supabase.co/functions/v1/keep-alive`
- **Backend URL**: `https://attendance-backend-9m05.onrender.com`
- **Schedule**: Every 14 minutes (`*/14 * * * *`)
- **Cron Service**: https://cron-job.org (recommended)

---

**Set up the cron job and your service will stay awake forever!** 🚀

