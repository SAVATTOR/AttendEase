# Local setup guide

Step-by-step instructions to run the Smart Attendance System on your machine.

**Using your own credentials?** → Start with [Setting up with your own credentials](#setting-up-with-your-own-credentials) below (Supabase + JWT secret + env files), then follow the rest of the guide.

---

## Setting up with your own credentials

You need **your own** Supabase project and a JWT secret. Nothing from the repo is shared.

### 1. Create a Supabase project (your database)

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New project**.
3. Choose an organization, set a **Project name** (e.g. `attendance-system`), set a **Database password** (save it — you’ll need it for the connection string), pick a region, then click **Create new project**.
4. Wait until the project is ready.

**Get your connection string:**

1. In the project, go to **Settings** (gear icon) → **Database**.
2. Scroll to **Connection string**.
3. Select the **URI** tab.
4. Copy the URI. It looks like:  
   `postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres`
5. Replace `[YOUR-PASSWORD]` with the database password you set in step 3. If the password has special characters (e.g. `#`, `@`), URL-encode them (e.g. `#` → `%23`, `@` → `%40`) or change the password in Supabase to something without special characters for simplicity.

Put this full URI in `backend/.env` as:

```env
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@...pooler.supabase.com:5432/postgres
```

### 2. Generate a JWT secret (your auth key)

Run this in a terminal (any folder):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the long string that’s printed (e.g. `a1b2c3d4e5...`). Put it in `backend/.env`:

```env
JWT_SECRET=paste_that_long_string_here
```

Use a **different** secret than anyone else; never commit this to Git.

### 3. Backend `.env` (minimum for local)

In the project folder:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set **at least**:

| Variable | Your value |
|----------|------------|
| `DATABASE_URL` | The Supabase URI from step 1 |
| `JWT_SECRET` | The string from step 2 |
| `CORS_ORIGIN` | `http://localhost:5173` (so the frontend can call the API) |

Keep or leave defaults for: `NODE_ENV=development`, `PORT=5000`, `JWT_EXPIRES_IN=7d`, and the attendance/QR settings.

**Optional – email (password reset, etc.):** If the app uses email, add your own in `backend/.env` (e.g. Gmail App Password, SendGrid, etc.). If those vars are missing or empty, the app still runs; email-related features may be disabled. See [README → Environment Setup](../README.md#-environment-setup) for options.

### 4. Frontend `.env` (your API URLs)

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

| Variable | Your value (local) |
|----------|---------------------|
| `VITE_API_URL` | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | `http://localhost:5000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Leave as-is or add your own key from [Google Cloud Console](https://console.cloud.google.com/) if you use maps |

If you deploy later, change these to your backend URL (e.g. `https://your-api.onrender.com/api`).

### 5. Create the database tables (using your Supabase)

From the project root:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

- `prisma db push` creates all tables in **your** Supabase project.
- `npm run seed` adds test users (teachers/students) so you can log in.

You’re now using **your own credentials** end-to-end: your Supabase DB and your JWT secret.

---

## Prerequisites

- **Node.js** ≥ 18 (`node --version`)
- **npm** ≥ 9 (`npm --version`)
- **Git**
- **Supabase account** (free): [supabase.com](https://supabase.com) — for PostgreSQL
- **Browser with camera** (for QR scanning) and **device with GPS** (for location checks)

---

## 1. Clone and install

```bash
git clone https://github.com/yourusername/smart-attendance-system.git
cd smart-attendance-system
```

**Backend:**

```bash
cd backend
npm install
cd ..
```

**Frontend:**

```bash
cd frontend
npm install
cd ..
```

---

## 2. Backend environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

| Variable | What to set |
|----------|-------------|
| `DATABASE_URL` | Supabase: **Settings → Database → Connection string → URI** (use the connection string, replace password if needed) |
| `NODE_ENV` | `development` |
| `PORT` | `5000` |
| `JWT_SECRET` | Long random string (e.g. 64+ chars). Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `http://localhost:5173` (or add your frontend URL) |

Optional: adjust `LOGIN_COOLDOWN_MINUTES`, `QR_REFRESH_INTERVAL_SECONDS`, `DEFAULT_ALLOWED_RADIUS_METERS`, and email-related vars if you use them. See [README → Environment Setup](../README.md#-environment-setup) for full list.

---

## 3. Frontend environment

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

| Variable | Local value |
|----------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | `http://localhost:5000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional; only if you use Google Maps features |

---

## 4. Database (Supabase)

In **Supabase Dashboard**: create a project if you don’t have one. Use its **Database → Connection string (URI)** in `DATABASE_URL` above.

From the project root:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

This creates tables and seeds test users/classes. Verify in Supabase **Table Editor**: `users`, `classes`, `enrollments`, `qr_sessions`, `attendances`, etc.

---

## 5. Run the app

**Terminal 1 – backend:**

```bash
cd backend
npm run dev
```

Backend: **http://localhost:5000**

**Terminal 2 – frontend:**

```bash
cd frontend
npm run dev
```

Frontend: **http://localhost:5173**

Open the frontend URL in a browser. Use the [test accounts](../README.md#-test-accounts) from the main README to log in as teacher or student.

---

## Quick reference

| Step | Command / action |
|------|-------------------|
| Clone | `git clone <repo> && cd smart-attendance-system` |
| Install | `cd backend && npm install` then `cd ../frontend && npm install` |
| Backend env | `cp backend/.env.example backend/.env` and fill (especially `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`) |
| Frontend env | `cp frontend/.env.example frontend/.env` and set `VITE_API_URL`, `VITE_SOCKET_URL` |
| DB | `cd backend && npx prisma generate && npx prisma db push && npm run seed` |
| Run backend | `cd backend && npm run dev` |
| Run frontend | `cd frontend && npm run dev` |

---

## Troubleshooting

- **Database connection failed:** Check `DATABASE_URL`, Supabase project status, and (if needed) allowed IPs in Supabase.
- **CORS errors:** Ensure `CORS_ORIGIN` in `backend/.env` includes your frontend URL (e.g. `http://localhost:5173`).
- **Prisma errors:** Run `npx prisma generate` in `backend`.
- **QR / camera:** Use HTTPS in production; on localhost, camera and location usually work in modern browsers.

More details: [README → Troubleshooting](../README.md#-troubleshooting).
