const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_DEMO_EMAIL || 'demo@hackersdeal.com';
  const password = process.env.SEED_DEMO_PASSWORD || 'demo12345';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: UserRole.CLIENT,
    },
    create: {
      email,
      password: passwordHash,
      role: UserRole.CLIENT,
      clientProfile: { create: {} },
    },
    select: { id: true, email: true, role: true },
  });

  console.log('Seed complete');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`User ID: ${user.id}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
