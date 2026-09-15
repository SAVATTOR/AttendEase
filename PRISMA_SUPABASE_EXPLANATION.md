# How Prisma + Supabase Work Together

## Overview

**Prisma** is an Object-Relational Mapping (ORM) tool that acts as a bridge between your Node.js application and your database. **Supabase** is a cloud platform that provides a managed PostgreSQL database. Together, Prisma connects to Supabase's PostgreSQL database to perform all database operations.

---

## What Is Each Component?

### Supabase
- **What it is:** A cloud platform (like Firebase for PostgreSQL)
- **What it provides:** Managed PostgreSQL database hosted in the cloud
- **Your connection:** You get a connection string (DATABASE_URL) that points to your Supabase database
- **Example URL:** `postgresql://user:password@host:port/database`

### Prisma
- **What it is:** An ORM (Object-Relational Mapping) tool
- **What it does:** Converts JavaScript/TypeScript code into SQL queries
- **Why use it:** Provides type-safe database access, prevents SQL injection, makes queries easier
- **How it works:** You write JavaScript code, Prisma converts it to SQL and executes it on your database

---

## How They Connect

### Step 1: Connection String

Your Supabase database connection string is stored in `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.rdjivkefulmocxyfmxyu:password@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

This URL contains:
- **Protocol:** `postgresql://`
- **Username:** `postgres.rdjivkefulmocxyfmxyu`
- **Password:** `password` (URL-encoded)
- **Host:** `aws-1-ap-northeast-2.pooler.supabase.com`
- **Port:** `5432`
- **Database:** `postgres`

### Step 2: Prisma Schema

In `backend/prisma/schema.prisma`, you define your database structure:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  // ← Reads from .env file
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role
  createdAt DateTime @default(now())
  
  @@map("users")  // Maps to "users" table in PostgreSQL
}
```

**What happens:**
- Prisma reads `DATABASE_URL` from your `.env` file
- It knows to connect to a PostgreSQL database
- The schema defines your tables and relationships

### Step 3: Prisma Client Generation

When you run `npx prisma generate` (or `npm run prisma:generate`):

1. Prisma reads your `schema.prisma` file
2. Generates a type-safe client (`@prisma/client`)
3. Creates JavaScript functions for each model (User, Class, Attendance, etc.)
4. These functions will connect to your Supabase database

**Generated code location:** `node_modules/.prisma/client/`

### Step 4: Database Connection

In `backend/src/config/database.js`:

```javascript
const { PrismaClient } = require('@prisma/client');

// Create Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'],
});

// Connect to database
const connectDatabase = async () => {
  try {
    await prisma.$connect();  // ← Connects to Supabase PostgreSQL
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
```

**What happens:**
- `new PrismaClient()` creates a client instance
- It automatically reads `DATABASE_URL` from environment variables
- `prisma.$connect()` establishes the connection to Supabase
- Connection is pooled (reused for multiple queries)

---

## How Database Operations Work

### Example 1: Creating a User

**Your Code (JavaScript):**
```javascript
const user = await prisma.user.create({
  data: {
    email: 'student@school.edu',
    password: hashedPassword,
    name: 'John Doe',
    role: 'STUDENT'
  }
});
```

**What Prisma Does:**
1. Converts your JavaScript object to SQL
2. Executes: `INSERT INTO users (id, email, password, name, role, created_at) VALUES (...)`
3. Sends SQL to Supabase PostgreSQL database
4. Returns the created user object

**What Supabase Does:**
1. Receives the SQL query
2. Executes it on the PostgreSQL database
3. Returns the result
4. Stores data in the `users` table

### Example 2: Finding a User

**Your Code:**
```javascript
const user = await prisma.user.findUnique({
  where: { email: 'student@school.edu' },
  select: {
    id: true,
    email: true,
    name: true,
    role: true
  }
});
```

**What Prisma Converts To:**
```sql
SELECT id, email, name, role 
FROM users 
WHERE email = 'student@school.edu' 
LIMIT 1;
```

**Flow:**
1. Your code calls `prisma.user.findUnique()`
2. Prisma generates SQL query
3. SQL sent to Supabase PostgreSQL
4. Supabase executes query and returns results
5. Prisma converts SQL results back to JavaScript object
6. You get a typed JavaScript object

### Example 3: Complex Query with Relations

**Your Code:**
```javascript
const classWithStudents = await prisma.class.findUnique({
  where: { id: 'class-id' },
  include: {
    enrollments: {
      include: {
        student: true
      }
    }
  }
});
```

**What Prisma Does:**
1. Generates multiple SQL queries (one for class, one for enrollments, one for students)
2. Executes them in sequence or parallel
3. Joins the results together
4. Returns a nested JavaScript object

**Result:**
```javascript
{
  id: 'class-id',
  name: 'CS101',
  enrollments: [
    {
      id: 'enrollment-1',
      student: {
        id: 'student-1',
        name: 'John Doe',
        email: 'john@school.edu'
      }
    }
  ]
}
```

---

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Node.js Application                 │
│                                                              │
│  const user = await prisma.user.create({ ... })            │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ JavaScript function call
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Prisma ORM                              │
│                                                              │
│  1. Reads schema.prisma                                     │
│  2. Generates SQL query                                     │
│  3. Validates data types                                    │
│  4. Prevents SQL injection                                   │
│                                                              │
│  Generated SQL:                                             │
│  INSERT INTO users (...) VALUES (...)                      │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ SQL query over network
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Supabase Platform                         │
│                                                              │
│  1. Receives SQL query                                      │
│  2. Validates connection                                    │
│  3. Routes to PostgreSQL database                           │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ SQL execution
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database (Supabase)                  │
│                                                              │
│  1. Executes SQL query                                      │
│  2. Updates/reads data                                      │
│  3. Returns results                                         │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ SQL results
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                      Prisma ORM                              │
│                                                              │
│  1. Receives SQL results                                     │
│  2. Converts to JavaScript objects                          │
│  3. Applies type safety                                     │
│  4. Returns typed object                                    │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ JavaScript object
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Your Node.js Application                 │
│                                                              │
│  const user = { id: '...', email: '...', ... }             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Benefits of This Setup

### 1. Type Safety
```javascript
// Prisma knows the structure, so TypeScript/IDE can autocomplete
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' }
});

// TypeScript knows user has: id, email, name, role, createdAt
console.log(user.name);  // ✅ TypeScript knows this exists
console.log(user.phone); // ❌ TypeScript error - doesn't exist
```

### 2. SQL Injection Prevention
```javascript
// ❌ BAD - Direct SQL (vulnerable to SQL injection)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD - Prisma (automatically prevents SQL injection)
const user = await prisma.user.findUnique({
  where: { email: email }  // Prisma sanitizes the input
});
```

### 3. Easy Relationships
```javascript
// Get a class with all enrolled students
const class = await prisma.class.findUnique({
  where: { id: classId },
  include: {
    enrollments: {
      include: {
        student: true  // Automatically joins related tables
      }
    }
  }
});
```

### 4. Database Migrations
```bash
# Prisma can create/update database tables automatically
npx prisma migrate dev --name add_user_table

# This:
# 1. Creates migration SQL file
# 2. Applies it to Supabase database
# 3. Updates Prisma client
```

---

## Real Examples from Your Codebase

### Example 1: Authentication (from `authenticate.js`)

```javascript
// Find user by ID
const user = await prisma.user.findUnique({
  where: { id: decoded.userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    createdAt: true,
  },
});

// Find active login session
const session = await prisma.loginSession.findFirst({
  where: {
    userId: user.id,
    token: token,
    isActive: true,
    expiresAt: {
      gt: new Date(),  // Greater than current time
    },
  },
});
```

**What happens:**
1. Prisma generates SQL to find user
2. Sends to Supabase PostgreSQL
3. Gets user data back
4. Generates another SQL to find session
5. Sends to Supabase
6. Returns session data

### Example 2: Creating Attendance (from `attendanceService.js`)

```javascript
const attendance = await prisma.attendance.create({
  data: {
    studentId: student.id,
    classId: classId,
    qrSessionId: qrSession.id,
    latitude: studentLatitude,
    longitude: studentLongitude,
    distance: calculatedDistance,
    status: 'PRESENT',
    markedAt: new Date(),
  },
});
```

**What Prisma does:**
1. Validates all fields match the schema
2. Generates: `INSERT INTO attendances (...) VALUES (...)`
3. Sends to Supabase
4. Supabase executes and returns the created record
5. Prisma converts to JavaScript object

### Example 3: Complex Query with Filters

```javascript
const attendances = await prisma.attendance.findMany({
  where: {
    studentId: userId,
    markedAt: {
      gte: startDate,  // Greater than or equal
      lte: endDate,     // Less than or equal
    },
    status: 'PRESENT',
  },
  include: {
    class: true,
    qrSession: true,
  },
  orderBy: {
    markedAt: 'desc',
  },
});
```

**Generated SQL (simplified):**
```sql
SELECT 
  a.*,
  c.*,
  q.*
FROM attendances a
LEFT JOIN classes c ON a.class_id = c.id
LEFT JOIN qr_sessions q ON a.qr_session_id = q.id
WHERE 
  a.student_id = $1
  AND a.marked_at >= $2
  AND a.marked_at <= $3
  AND a.status = 'PRESENT'
ORDER BY a.marked_at DESC;
```

---

## Database Schema Synchronization

### How Schema Changes Work

1. **You modify `schema.prisma`:**
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  phone     String?  // ← Added new field
}
```

2. **Run migration:**
```bash
npx prisma migrate dev --name add_phone_field
```

3. **What happens:**
   - Prisma generates SQL: `ALTER TABLE users ADD COLUMN phone VARCHAR(255)`
   - Applies it to Supabase database
   - Updates Prisma client
   - Your code can now use `user.phone`

### Pushing Schema Directly (Development)

```bash
npx prisma db push
```

**What it does:**
- Reads `schema.prisma`
- Compares with Supabase database
- Applies changes directly (no migration files)
- Useful for rapid development

---

## Connection Pooling

Supabase uses **connection pooling** to handle multiple requests efficiently:

```
Your App → Prisma → Supabase Pooler → PostgreSQL Database
                ↑
         Reuses connections
         (faster, more efficient)
```

**Benefits:**
- Faster connections (reuses existing)
- Handles more concurrent requests
- Better performance under load

**Your connection string uses the pooler:**
```
postgresql://...@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
                                                          ^^^^^^
                                                          Pooler
```

---

## Environment Variables

### Development (Local)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/attendance_db
```

### Production (Supabase)
```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**Prisma automatically:**
- Reads `DATABASE_URL` from `.env`
- Connects to the correct database
- Works the same way in dev and production

---

## Common Operations

### Create (INSERT)
```javascript
const user = await prisma.user.create({
  data: { email: 'test@example.com', name: 'Test User' }
});
```

### Read (SELECT)
```javascript
// Find one
const user = await prisma.user.findUnique({
  where: { id: 'user-id' }
});

// Find many
const users = await prisma.user.findMany({
  where: { role: 'STUDENT' }
});
```

### Update (UPDATE)
```javascript
const user = await prisma.user.update({
  where: { id: 'user-id' },
  data: { name: 'New Name' }
});
```

### Delete (DELETE)
```javascript
await prisma.user.delete({
  where: { id: 'user-id' }
});
```

### Transactions
```javascript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });
  await tx.class.create({ data: { teacherId: user.id } });
  // Both succeed or both fail (atomic)
});
```

---

## Troubleshooting

### Connection Issues

**Error:** `Can't reach database server`
- Check `DATABASE_URL` in `.env`
- Verify Supabase database is running
- Check network/firewall settings

**Error:** `Authentication failed`
- Verify username/password in connection string
- Check if password needs URL encoding (`@` → `%40`)

### Schema Sync Issues

**Error:** `Table doesn't exist`
- Run `npx prisma db push` or `npx prisma migrate dev`
- Check if schema matches database

**Error:** `Column doesn't exist`
- Update schema and run migration
- Or manually add column in Supabase dashboard

### Performance Issues

**Slow queries:**
- Add indexes in schema: `@@index([email])`
- Use `select` to limit fields: `select: { id: true, email: true }`
- Check Supabase dashboard for query performance

---

## Summary

**Prisma + Supabase = Powerful Database Solution**

1. **Supabase** provides the PostgreSQL database (hosted in cloud)
2. **Prisma** provides the interface to interact with it (from your code)
3. **Connection** happens via `DATABASE_URL` environment variable
4. **Operations** are type-safe, secure, and easy to use
5. **Schema** is defined once in `schema.prisma` and synced automatically

**Key Takeaway:** You write JavaScript code, Prisma converts it to SQL, Supabase executes it on PostgreSQL, and you get typed results back. It's that simple!

---

*This setup gives you the best of both worlds: Supabase's managed database infrastructure and Prisma's developer-friendly ORM.*

