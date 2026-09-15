# 📚 Smart Attendance System

A modern, web-based attendance management system with QR code scanning and GPS location verification. Built for educational institutions to streamline attendance tracking with anti-fraud measures.

![Smart Attendance System](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

## 📢 Telling someone about this project

**One-liner:** A web-based attendance system for schools: teachers run live QR sessions; students scan to mark attendance with GPS verification and anti-fraud (rotating QR, duplicate prevention). React + Node + PostgreSQL, deployed on Firebase + Render.

**Short pitch:** Smart Attendance System lets teachers create classes, start live QR sessions (refreshing every 5 seconds), and see who marked attendance in real time. Students scan the teacher’s QR with their phone (camera + GPS). Built with React/TypeScript, Node/Express, Prisma, Supabase (PostgreSQL), Socket.io for real-time updates, and 53 passing tests. Backend on Render, frontend on Firebase Hosting.

**Local setup:** See [Local setup guide](docs/SETUP.md) for step-by-step instructions to run it on your machine (clone → install → env → database → run).

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Telling someone about this project](#-telling-someone-about-this-project)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Local setup (quick guide)](docs/SETUP.md)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Test Accounts](#-test-accounts)
- [Screenshots](#-screenshots)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🎯 Overview

The Smart Attendance System is a comprehensive solution designed to automate and secure the attendance marking process in educational settings. It eliminates proxy attendance through rotating QR codes that refresh every 5 seconds and GPS-based location verification.

### Key Highlights

- **For Teachers**: Create classes, manage students, start live attendance sessions, and view detailed analytics
- **For Students**: Scan QR codes to mark attendance, view attendance history, and track attendance percentage
- **Anti-Fraud**: Rotating QR codes + GPS verification + duplicate prevention + session-based tokens
- **Production Ready**: 100% test coverage with 53 passing tests
- **Deployed**: Backend on Render, Frontend on Firebase Hosting

---

## ✨ Features

### 👨‍🏫 Teacher Features

| Feature | Description |
|---------|-------------|
| **Class Management** | Create, edit, and delete classes with custom settings |
| **Live QR Sessions** | Generate rotating QR codes that refresh every 5 seconds |
| **Session Controls** | Start, pause, resume, and end attendance sessions |
| **Real-time Monitoring** | Watch students mark attendance in real-time via WebSocket |
| **Attendance Reports** | View and filter attendance by date, class, or status |
| **CSV Export** | Export attendance data for external analysis |
| **Custom Settings** | Configure session duration, allowed radius, late threshold |

### 👨‍🎓 Student Features

| Feature | Description |
|---------|-------------|
| **QR Scanning** | Scan teacher's QR code using device camera |
| **Location Verification** | GPS-based proximity check to teacher's location |
| **Attendance History** | View personal attendance records with filters |
| **Class Enrollment** | Join classes using unique class codes |
| **Attendance Stats** | Track attendance percentage and streaks |
| **Export Records** | Download personal attendance as CSV |

### 🔒 Security Features

| Feature | Description |
|---------|-------------|
| **Rotating QR Codes** | New code generated every 5 seconds |
| **GPS Verification** | Must be within configurable radius (default: 50m) |
| **Session Tokens** | JWT-based short-lived tokens in QR |
| **Duplicate Prevention** | One attendance per student per session |
| **Login Cooldown** | 20-minute cooldown between logins |
| **Rate Limiting** | API request throttling to prevent abuse |

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **PostgreSQL** | Database (via Supabase) |
| **Prisma** | ORM for database operations |
| **Socket.io** | Real-time communication |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing |

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **React Router v6** | Navigation |
| **TanStack Query** | Server state management |
| **Socket.io Client** | Real-time updates |
| **html5-qrcode** | QR code scanning |
| **qrcode.react** | QR code generation |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Supabase** | PostgreSQL database hosting |
| **Vercel/Netlify** | Frontend hosting (optional) |
| **Railway/Render** | Backend hosting (optional) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Teacher   │  │   Student   │  │      Common Components  │  │
│  │  Dashboard  │  │  Dashboard  │  │  (Auth, Layout, etc.)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                       │               │
│         └────────────────┼───────────────────────┘               │
│                          │                                       │
│                   ┌──────▼──────┐                               │
│                   │  API Layer  │ (Axios + React Query)         │
│                   └──────┬──────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    HTTP/WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                         BACKEND                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Express.js Server                     │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │    │
│  │  │  Auth   │  │  Class  │  │   QR    │  │ Attendance│  │    │
│  │  │ Routes  │  │ Routes  │  │ Routes  │  │  Routes   │  │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └─────┬─────┘  │    │
│  │       └────────────┼───────────┼──────────────┘        │    │
│  │                    │           │                        │    │
│  │              ┌─────▼───────────▼─────┐                 │    │
│  │              │    Service Layer      │                 │    │
│  │              └───────────┬───────────┘                 │    │
│  │                          │                              │    │
│  │              ┌───────────▼───────────┐                 │    │
│  │              │    Prisma ORM         │                 │    │
│  │              └───────────┬───────────┘                 │    │
│  └──────────────────────────┼──────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │  Supabase   │
                        │ PostgreSQL  │
                        └─────────────┘
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | >= 18.0.0 | `node --version` |
| npm | >= 9.0.0 | `npm --version` |
| Git | Latest | `git --version` |

You'll also need:
- A [Supabase](https://supabase.com) account (free tier works)
- A modern web browser with camera access (for QR scanning)
- A device with GPS capabilities (for location verification)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/smart-attendance-system.git
cd smart-attendance-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# ===========================================
# DATABASE CONNECTION (Supabase)
# ===========================================
# Get from: Supabase Dashboard → Settings → Database → Connection string → URI
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"

# ===========================================
# SERVER CONFIGURATION
# ===========================================
NODE_ENV=development
PORT=5000

# ===========================================
# JWT CONFIGURATION
# ===========================================
# Generate a secure secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long-for-security
JWT_EXPIRES_IN=7d

# ===========================================
# CORS CONFIGURATION
# ===========================================
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# ===========================================
# ATTENDANCE SETTINGS
# ===========================================
LOGIN_COOLDOWN_MINUTES=20
QR_REFRESH_INTERVAL_SECONDS=5
QR_SESSION_DURATION_MINUTES=60
DEFAULT_ALLOWED_RADIUS_METERS=50

# ===========================================
# EMAIL CONFIGURATION
# ===========================================
# Email service: gmail, sendgrid, ses, mailgun, or leave empty for generic SMTP
EMAIL_SERVICE=gmail

# Gmail Configuration (use App Password, not your regular password)
# To generate App Password: Google Account → Security → 2-Step Verification → App Passwords
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Optional: Custom from name
EMAIL_FROM_NAME=Smart Attendance System
EMAIL_REPLY_TO=your-email@gmail.com

# Generic SMTP (if not using a specific service)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false

# SendGrid (if EMAIL_SERVICE=sendgrid)
# SENDGRID_API_KEY=your-sendgrid-api-key

# AWS SES (if EMAIL_SERVICE=ses)
# AWS_REGION=us-east-1
# AWS_SES_ACCESS_KEY=your-access-key
# AWS_SES_SECRET_KEY=your-secret-key

# Mailgun (if EMAIL_SERVICE=mailgun)
# MAILGUN_USER=your-mailgun-user
# MAILGUN_PASSWORD=your-mailgun-password
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env
```

Edit the `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🗄️ Database Setup

### Option 1: Using Prisma (Recommended)

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed with test data
npm run seed
```

### Option 2: Using SQL Directly

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and run the SQL from `database.sql` (if provided)

### Verify Setup

Check your Supabase Table Editor for these tables:
- ✅ users
- ✅ user_settings
- ✅ login_sessions
- ✅ classes
- ✅ enrollments
- ✅ qr_sessions
- ✅ attendances

---

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs at: `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

### Running Tests

**Comprehensive API Test Suite:**
```bash
node comprehensive-ui-test.js
```

**Backend Tests:**
```bash
cd backend
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests only
```

**Frontend Tests:**
```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Watch mode
```

**Test Results:** ✅ **53/53 tests passing (100% pass rate)**

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All protected routes require a Bearer token:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints Overview

#### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | User login | ❌ |
| POST | `/auth/logout` | User logout | ✅ |
| POST | `/auth/logout-all` | Logout all devices | ✅ |
| GET | `/auth/me` | Get current user | ✅ |
| GET | `/auth/cooldown-status` | Check login cooldown | ❌ |

#### Classes
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/classes` | Get my classes | ✅ | Any |
| GET | `/classes/:id` | Get class details | ✅ | Any |
| POST | `/classes` | Create class | ✅ | Teacher |
| PUT | `/classes/:id` | Update class | ✅ | Teacher |
| DELETE | `/classes/:id` | Delete class | ✅ | Teacher |
| POST | `/classes/enroll` | Enroll in class | ✅ | Student |
| DELETE | `/classes/:id/unenroll` | Leave class | ✅ | Student |
| GET | `/classes/:id/students` | Get class students | ✅ | Teacher |

#### QR Sessions
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/qr/generate` | Start QR session | ✅ | Teacher |
| GET | `/qr/active/:classId` | Get active session | ✅ | Teacher |
| POST | `/qr/validate` | Validate QR code | ✅ | Student |
| POST | `/qr/:sessionId/pause` | Pause session | ✅ | Teacher |
| POST | `/qr/:sessionId/resume` | Resume session | ✅ | Teacher |
| DELETE | `/qr/:sessionId` | End session | ✅ | Teacher |
| GET | `/qr/history/:classId` | Session history | ✅ | Teacher |

#### Attendance
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/attendance/mark` | Mark attendance | ✅ | Student |
| GET | `/attendance/my` | My attendance | ✅ | Student |
| GET | `/attendance/class/:id` | Class attendance | ✅ | Teacher |
| GET | `/attendance/stats` | Attendance stats | ✅ | Any |

#### Settings
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/settings` | Get settings | ✅ |
| PUT | `/settings` | Update settings | ✅ |
| PUT | `/settings/profile` | Update profile | ✅ |
| PUT | `/settings/password` | Change password | ✅ |
| DELETE | `/settings/account` | Delete account | ✅ |

#### Export
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/export/class/:id/csv` | Export class attendance | ✅ | Teacher |
| GET | `/export/session/:id/csv` | Export session attendance | ✅ | Teacher |
| GET | `/export/my-attendance/csv` | Export my attendance | ✅ | Student |

### WebSocket Events

#### Teacher Events
```javascript
// Join class room for real-time updates
socket.emit('join-class-room', classId);

// Start QR auto-refresh
socket.emit('start-qr-session', { sessionId, classId });

// Stop QR session
socket.emit('stop-qr-session', { sessionId, classId });

// Listen for new attendance
socket.on('new-attendance', (data) => {
  // { studentId, studentName, status, markedAt }
});

// Listen for QR refresh
socket.on('qr-refreshed', (data) => {
  // { sessionId, token, refreshedAt }
});
```

---

## 📁 Project Structure

```
smart-attendance-system/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Seed data script
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Prisma client setup
│   │   │   ├── env.js             # Environment variables
│   │   │   └── socket.js          # Socket.io config
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── classController.js
│   │   │   ├── exportController.js
│   │   │   ├── qrController.js
│   │   │   ├── settingsController.js
│   │   │   └── userController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authenticate.js    # JWT verification
│   │   │   ├── authorize.js       # Role-based access
│   │   │   ├── errorHandler.js    # Global error handler
│   │   │   ├── loginCooldown.js   # Login rate limiting
│   │   │   └── validateRequest.js # Input validation
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── classRoutes.js
│   │   │   ├── exportRoutes.js
│   │   │   ├── qrRoutes.js
│   │   │   ├── settingsRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── attendanceService.js
│   │   │   ├── locationService.js
│   │   │   ├── qrService.js
│   │   │   └── sessionService.js
│   │   │
│   │   ├── socket/
│   │   │   └── qrSocketHandler.js # Real-time QR updates
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiError.js        # Custom error class
│   │   │   ├── constants.js       # App constants
│   │   │   ├── helpers.js         # Utility functions
│   │   │   └── validators.js      # Validation rules
│   │   │
│   │   └── app.js                 # Express app setup
│   │
│   ├── .env.example
│   ├── package.json
│   └── server.js                  # Entry point
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/            # Shared components
│   │   │   ├── auth/              # Auth components
│   │   │   ├── teacher/           # Teacher-specific
│   │   │   ├── student/           # Student-specific
│   │   │   └── layout/            # Layout components
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── teacher/
│   │   │   └── student/
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── SocketContext.tsx
│   │   │   └── ToastContext.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   ├── useGeolocation.ts
│   │   │   └── useQRScanner.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── classService.ts
│   │   │   ├── attendanceService.ts
│   │   │   ├── qrService.ts
│   │   │   ├── settingsService.ts
│   │   │   └── exportService.ts
│   │   │
│   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docs/
│   ├── API.md
│   └── SETUP.md
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🧪 Test Accounts

After running the seed script, use these accounts for testing:

### Teachers

| Email | Password | Classes |
|-------|----------|---------|
| teacher1@school.edu | Password123 | CS101A, CS201B |
| teacher2@school.edu | Password123 | CS301C |

### Students

| Email | Password | Enrolled In |
|-------|----------|-------------|
| student1@school.edu | Password123 | CS101A, CS201B |
| student2@school.edu | Password123 | CS101A, CS201B |
| student3@school.edu | Password123 | CS101A, CS301C |
| student4@school.edu | Password123 | CS201B, CS301C |
| student5@school.edu | Password123 | CS301C |

### Class Codes

| Class | Code | Teacher |
|-------|------|---------|
| Introduction to Computer Science | CS101A | teacher1@school.edu |
| Data Structures | CS201B | teacher1@school.edu |
| Database Systems | CS301C | teacher2@school.edu |

---

## 📸 Screenshots

### Teacher Dashboard
![Teacher Dashboard](docs/screenshots/teacher-dashboard.png)
*Overview of classes, students, and recent sessions*

### Live QR Session
![QR Session](docs/screenshots/qr-session.png)
![QR Session 2](docs/screenshots/qr-session-2.png)
*Real-time rotating QR code with attendance tracking*

### Student Scanner
![Student Scanner](docs/screenshots/student-scanner.png)
*QR scanning interface with location verification*

### Attendance Records
![Attendance Records](docs/screenshots/attendance-records.png)
*Filterable attendance data with export options*

> **Note**: Add your own screenshots to the `docs/screenshots/` directory

---

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with 7-day expiry
- Role-based access control (TEACHER/STUDENT)
- Bcrypt password hashing with salt rounds
- Session management with logout from all devices

### Anti-Fraud Measures
- **Rotating QR Codes**: New token every 5 seconds
- **GPS Verification**: Haversine formula for distance calculation
- **Single Submission**: One attendance per student per session (enforced at database level)
- **Token Expiry**: QR tokens expire in 30 seconds
- **Session Tokens**: JWT embedded in QR with short TTL

### Rate Limiting
- 100 requests per 15 minutes (general, increased to 10,000 in dev/test)
- 10 login attempts per 15 minutes (increased to 1,000 in dev/test)
- 20-minute cooldown between successful logins (suppressed in dev/test)

### Data Protection
- Input validation on all endpoints
- SQL injection prevention via Prisma ORM
- XSS protection via Helmet.js
- CORS configured for allowed origins only

## 🧪 Testing & Quality Assurance

### Test Coverage

- **Total Tests**: 53
- **Pass Rate**: 100% ✅
- **Test Categories**:
  - Health Check (2 tests)
  - Authentication (7 tests)
  - Class Management (9 tests)
  - QR Session Management (8 tests)
  - Attendance (6 tests) - **Includes duplicate prevention**
  - Settings (7 tests)
  - Export Functionality (3 tests)
  - User Management (4 tests)
  - Error Handling (4 tests)
  - Cleanup (3 tests)

### Recent Fixes

1. **Duplicate Attendance Prevention** ✅
   - Fixed backend bug: Changed `isActive` check to `status !== 'ACTIVE'`
   - Database-level unique constraint prevents duplicates
   - Application-level validation ensures one attendance per session

2. **Student Attendance Stats** ✅
   - Fixed 500 error when student has no enrolled classes
   - Added comprehensive error handling for edge cases

3. **Login Cooldown** ✅
   - Suppressed in development/test environments
   - Test helper endpoint for session cleanup

See [TEST_REPORT.md](archive/TEST_REPORT.md) for detailed test results.

---

## 🚀 Deployment

### Backend (Render)

The backend is deployed on Render with:
- Automatic deployments from GitHub
- PostgreSQL database via Supabase
- Keep-alive function to prevent spinning down
- Environment variables configured

### Frontend (Firebase Hosting)

The frontend is deployed on Firebase Hosting with:
- Automatic builds from GitHub
- CDN distribution
- HTTPS enabled
- Custom domain support

### Environment Variables

Production environment variables are configured in:
- **Render**: Dashboard → Environment Variables
- **Firebase**: Project Settings → Environment Variables

See deployment documentation in `docs/DEPLOYMENT.md` for detailed setup instructions.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

```bash
git clone https://github.com/yourusername/smart-attendance-system.git
```

### 2. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed
- Ensure all tests pass

### 4. Test Your Changes

```bash
# Comprehensive API test suite
node comprehensive-ui-test.js

# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### 5. Submit a Pull Request

- Provide a clear description of changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure test coverage is maintained

### Code Style Guidelines

- Use ESLint and Prettier configurations
- Follow TypeScript best practices
- Write meaningful commit messages
- Keep functions small and focused
- Add tests for new features

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Can't reach database server
```
**Solution**: 
1. Check your DATABASE_URL in `.env`
2. Verify Supabase project is active
3. Check if IP is whitelisted in Supabase

#### Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```
**Solution**:
```bash
npx prisma generate
```

#### CORS Errors
```
Access-Control-Allow-Origin error
```
**Solution**: 
1. Add your frontend URL to CORS_ORIGIN in backend `.env`
2. Restart the backend server

#### QR Scanner Not Working
**Possible causes**:
1. Camera permissions denied → Check browser settings
2. Not using HTTPS → Use localhost or deploy with SSL
3. Browser not supported → Use Chrome, Firefox, or Safari

#### Location Permission Denied
**Solution**:
1. Check browser location settings
2. Ensure HTTPS in production
3. Verify device GPS is enabled

### Getting Help

- 📖 Check the [documentation](docs/)
- 🐛 Open an [issue](https://github.com/yourusername/smart-attendance-system/issues)
- 💬 Start a [discussion](https://github.com/yourusername/smart-attendance-system/discussions)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Smart Attendance System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for PostgreSQL hosting
- [Prisma](https://prisma.io) for the excellent ORM
- [Socket.io](https://socket.io) for real-time functionality
- [Tailwind CSS](https://tailwindcss.com) for styling
- [React](https://react.dev) for the UI library
- [Vite](https://vitejs.dev) for the blazing fast build tool

---

## 📞 Contact

**Project Maintainer**: Muhammad Ahad Imran

- GitHub: [@Ahad690](https://github.com/Ahad690)
- Email: muhammadahad350@gmail.com

---

<p align="center">
  Made with ❤️ for better attendance management
</p>

<p align="center">
  <a href="#-smart-attendance-system">Back to Top ⬆️</a>
</p>#   A t t e n d E a s e  
 