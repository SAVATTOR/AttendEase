const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying database migrations...');

    // Check which columns already exist
    const checkColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `;

    const existingColumns = checkColumns.map((col) => col.column_name);

    // List of all required columns
    const requiredColumns = {
      emailVerification: ['isEmailVerified', 'emailVerificationCode', 'emailVerificationCodeExpiresAt'],
      studentFields: ['indexNumber', 'session', 'program']
    };

    // Check email verification columns
    const emailColumnsExist =
      existingColumns.includes('isEmailVerified') &&
      existingColumns.includes('emailVerificationCode') &&
      existingColumns.includes('emailVerificationCodeExpiresAt');

    // Check student field columns
    const studentColumnsExist =
      existingColumns.includes('indexNumber') &&
      existingColumns.includes('session') &&
      existingColumns.includes('program');

    // Apply email verification migration if needed
    if (!emailColumnsExist) {
      console.log('📧 Adding email verification columns...');
      const migrationPath = path.join(__dirname, '../prisma/migrations/20251226_add_email_verification/migration.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await prisma.$executeRawUnsafe(migrationSQL);
      console.log('✅ Email verification columns added!');
    } else {
      console.log('ℹ️  Email verification columns already exist');
    }

    // Add student field columns if needed
    if (!studentColumnsExist) {
      console.log('👨‍🎓 Adding student field columns (indexNumber, session, program)...');
      const addStudentColumnsSQL = `
        ALTER TABLE "users" 
        ADD COLUMN IF NOT EXISTS "indexNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "session" TEXT,
        ADD COLUMN IF NOT EXISTS "program" TEXT;
      `;
      await prisma.$executeRawUnsafe(addStudentColumnsSQL);
      console.log('✅ Student field columns added!');
    } else {
      console.log('ℹ️  Student field columns already exist');
    }

    // Check and add classes.group column
    const checkClassColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'classes'
    `;

    const existingClassColumns = checkClassColumns.map((col) => col.column_name);

    if (!existingClassColumns.includes('group')) {
      console.log('📚 Adding group column to classes table...');
      const addGroupColumnSQL = `
        ALTER TABLE "classes" 
        ADD COLUMN IF NOT EXISTS "group" TEXT;
      `;
      await prisma.$executeRawUnsafe(addGroupColumnSQL);
      console.log('✅ Group column added to classes!');
    } else {
      console.log('ℹ️  Classes group column already exists');
    }

    // Check and add login_sessions.deviceId column
    const checkSessionColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'login_sessions'
    `;

    const existingSessionColumns = checkSessionColumns.map((col) => col.column_name);

    if (!existingSessionColumns.includes('deviceId')) {
      console.log('📱 Adding deviceId column to login_sessions table...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "login_sessions" ADD COLUMN IF NOT EXISTS "deviceId" TEXT`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "login_sessions_deviceId_idx" ON "login_sessions" ("deviceId")`);
      console.log('✅ DeviceId column added to login_sessions!');
    } else {
      console.log('ℹ️  DeviceId column already exists');
    }

    console.log('✅ All migrations applied successfully!');
  } catch (error) {
    // If columns already exist, that's okay
    if (error.message.includes('already exists') || error.message.includes('duplicate') || (error.message.includes('column') && error.message.includes('already'))) {
      console.log('ℹ️  Migration columns may already exist, skipping...');
    } else {
      console.error('❌ Migration failed:', error.message);
      // Don't throw - allow server to start even if migration fails
      // This prevents deployment issues if migration has already been applied
      console.log('⚠️  Continuing with server start despite migration warning...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

