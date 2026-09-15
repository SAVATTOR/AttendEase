const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.attendance.deleteMany();
  await prisma.qRSession.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.loginSession.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create password hash
  const passwordHash = await bcrypt.hash('Password123', 10);

  // Create Teachers
  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@school.edu',
      password: passwordHash,
      name: 'John Smith',
      role: 'TEACHER',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@school.edu',
      password: passwordHash,
      name: 'Jane Doe',
      role: 'TEACHER',
    },
  });

  console.log('✅ Created teachers');

  // Create Students
  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'student1@school.edu',
        password: passwordHash,
        name: 'Alice Johnson',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'student2@school.edu',
        password: passwordHash,
        name: 'Bob Williams',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'student3@school.edu',
        password: passwordHash,
        name: 'Charlie Brown',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'student4@school.edu',
        password: passwordHash,
        name: 'Diana Ross',
        role: 'STUDENT',
      },
    }),
    prisma.user.create({
      data: {
        email: 'student5@school.edu',
        password: passwordHash,
        name: 'Edward Chen',
        role: 'STUDENT',
      },
    }),
  ]);

  console.log('✅ Created students');

  // Create Classes
  const class1 = await prisma.class.create({
    data: {
      name: 'Introduction to Computer Science',
      description: 'Fundamentals of programming and computational thinking',
      code: 'CS101A',
      teacherId: teacher1.id,
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        startTime: '09:00',
        endTime: '10:30',
      },
      allowedRadius: 50,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: 'Data Structures',
      description: 'Advanced data structures and algorithms',
      code: 'CS201B',
      teacherId: teacher1.id,
      schedule: {
        days: ['Tuesday', 'Thursday'],
        startTime: '14:00',
        endTime: '15:30',
      },
      allowedRadius: 75,
    },
  });

  const class3 = await prisma.class.create({
    data: {
      name: 'Database Systems',
      description: 'Relational databases and SQL',
      code: 'CS301C',
      teacherId: teacher2.id,
      schedule: {
        days: ['Monday', 'Wednesday'],
        startTime: '11:00',
        endTime: '12:30',
      },
      allowedRadius: 50,
    },
  });

  console.log('✅ Created classes');

  // Create Enrollments
  await prisma.enrollment.createMany({
    data: [
      { studentId: students[0].id, classId: class1.id },
      { studentId: students[1].id, classId: class1.id },
      { studentId: students[2].id, classId: class1.id },
      { studentId: students[0].id, classId: class2.id },
      { studentId: students[1].id, classId: class2.id },
      { studentId: students[3].id, classId: class2.id },
      { studentId: students[2].id, classId: class3.id },
      { studentId: students[3].id, classId: class3.id },
      { studentId: students[4].id, classId: class3.id },
    ],
  });

  console.log('✅ Created enrollments');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('─────────────────────────────────────');
  console.log('Teachers:');
  console.log('  Email: teacher1@school.edu');
  console.log('  Email: teacher2@school.edu');
  console.log('  Password: Password123');
  console.log('');
  console.log('Students:');
  console.log('  Email: student1@school.edu');
  console.log('  Email: student2@school.edu');
  console.log('  Email: student3@school.edu');
  console.log('  Email: student4@school.edu');
  console.log('  Email: student5@school.edu');
  console.log('  Password: Password123');
  console.log('─────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });