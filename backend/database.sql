-- ===========================================
-- SMART ATTENDANCE SYSTEM DATABASE SCHEMA
-- ===========================================
-- Run this in Supabase SQL Editor if you prefer manual setup
-- Otherwise, just use: npx prisma db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- ENUMS
-- ===========================================

CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'INVALID_LOCATION');
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'EXPIRED');

-- ===========================================
-- USERS TABLE
-- ===========================================

CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ===========================================
-- USER SETTINGS TABLE
-- ===========================================

CREATE TABLE "user_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "sessionReminders" BOOLEAN NOT NULL DEFAULT true,
    "defaultSessionDuration" INTEGER NOT NULL DEFAULT 60,
    "defaultAllowedRadius" INTEGER NOT NULL DEFAULT 50,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================
-- LOGIN SESSIONS TABLE
-- ===========================================

CREATE TABLE "login_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "login_sessions_token_key" ON "login_sessions"("token");
CREATE INDEX "login_sessions_userId_idx" ON "login_sessions"("userId");
CREATE INDEX "login_sessions_token_idx" ON "login_sessions"("token");

ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================
-- CLASSES TABLE
-- ===========================================

CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "teacherId" UUID NOT NULL,
    "schedule" JSONB,
    "allowedRadius" INTEGER NOT NULL DEFAULT 50,
    "lateThresholdMinutes" INTEGER NOT NULL DEFAULT 15,
    "sessionDurationMins" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");
CREATE INDEX "classes_teacherId_idx" ON "classes"("teacherId");
CREATE INDEX "classes_code_idx" ON "classes"("code");

ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" 
    FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================
-- ENROLLMENTS TABLE (Many-to-Many: Students <-> Classes)
-- ===========================================

CREATE TABLE "enrollments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "studentId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "enrollments_studentId_classId_key" ON "enrollments"("studentId", "classId");
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");
CREATE INDEX "enrollments_classId_idx" ON "enrollments"("classId");

ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================
-- QR SESSIONS TABLE
-- ===========================================

CREATE TABLE "qr_sessions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "classId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "resumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "qr_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qr_sessions_token_key" ON "qr_sessions"("token");
CREATE INDEX "qr_sessions_classId_idx" ON "qr_sessions"("classId");
CREATE INDEX "qr_sessions_token_idx" ON "qr_sessions"("token");
CREATE INDEX "qr_sessions_status_idx" ON "qr_sessions"("status");

ALTER TABLE "qr_sessions" ADD CONSTRAINT "qr_sessions_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================
-- ATTENDANCE TABLE
-- ===========================================

CREATE TABLE "attendances" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "studentId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "qrSessionId" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceInfo" TEXT,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "attendances_studentId_qrSessionId_key" ON "attendances"("studentId", "qrSessionId");
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");
CREATE INDEX "attendances_classId_idx" ON "attendances"("classId");
CREATE INDEX "attendances_qrSessionId_idx" ON "attendances"("qrSessionId");
CREATE INDEX "attendances_markedAt_idx" ON "attendances"("markedAt");

ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" 
    FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendances" ADD CONSTRAINT "attendances_classId_fkey" 
    FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendances" ADD CONSTRAINT "attendances_qrSessionId_fkey" 
    FOREIGN KEY ("qrSessionId") REFERENCES "qr_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ===========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON "user_settings"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON "classes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
