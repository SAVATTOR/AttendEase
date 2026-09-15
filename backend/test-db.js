const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('Attempting to connect to database...');
    console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);

    try {
        await prisma.$connect();
        console.log('✅ Success! Connected to database.');

        // Test a simple query
        const count = await prisma.user.count();
        console.log('✅ Query success! User count:', count);

    } catch (error) {
        console.error('❌ Connection failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
