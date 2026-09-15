# Database Credential Management Guide

This document explains how to safely reset or delete user credentials, active login sessions, and users in the `attendance-system-client` backend database.

> ⚠️ **Warning:** The operations described below alter database state. Be very careful running these commands and scripts in a production environment. 

Our application uses Prisma Client mapped to a PostgreSQL database (hosted on Supabase) and stores passwords hashed securely via `bcryptjs`. We map credentials mostly to the `User` and `LoginSession` models.

---

## 1. Using Prisma Studio (Visual GUI)

For localized or immediate visual changes without coding, Prisma Studio is the built-in database interface:

1. Open a terminal and navigate to the `backend/` directory.
2. Run the start command:
   ```bash
   npm run prisma:studio
   ```
3. Your browser will open the Prisma Studio interface at `http://localhost:5555`.
4. Navigate to either `User` or `LoginSession` tables.
5. You can visually select rows to delete, edit user details directly, and view active sessions.

---

## 2. Programmatic Scripts

If you want to clear credentials programmatically or during development, you can create the following Node.js scripts in the root of your `backend/` directory and run them.

### A. Clear All Active Sessions (Force a widespread logout)

If you only want to force everyone out of the application but preserve their accounts and passwords, you can wipe the `LoginSession` table.

**Create `backend/reset-sessions.js`**:
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearSessions() {
  try {
    // This deletes all records in the LoginSession table
    const result = await prisma.loginSession.deleteMany({});
    console.log(`Successfully deleted ${result.count} active login sessions.`);
  } catch (error) {
    console.error("Error clearing sessions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions();
```

**Run it:**
```bash
node reset-sessions.js
```

### B. Reset all Passwords to a Default

If you need to rest all passwords to a single development password (e.g., `password123`). This script updates everyone's password and clears their current login session.

**Create `backend/reset-passwords.js`**:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    // Let's create a hash for "password123"
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Update all users with the new password
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    });
    
    // Also clear all active login sessions so they must log in with the new password
    await prisma.loginSession.deleteMany({});

    console.log(`Successfully reset passwords for ${result.count} users.`);
    console.log(`All active sessions have been wiped.`);
  } catch (error) {
    console.error("Error resetting passwords:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();
```

**Run it:**
```bash
node reset-passwords.js
```

---

## 3. Raw SQL Commands (Via Supabase)

If you prefer using direct SQL inside the Supabase SQL Editor, here are the equivalent commands.

### Delete all sessions:
```sql
DELETE FROM login_sessions;
```

### Completely WIPE all users from the system:
> 🚨 **EXTREME DANGER!** Because `User` has `Cascade` onDelete relations to `login_sessions`, `user_settings`, `enrollments`, and `attendances`, this command will effectively **delete ALL data associated with those users**.

```sql
DELETE FROM users;
```
