const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/** Singleton platform wallet row (referenced by env PLATFORM_WALLET_ID in ops docs). */
const PLATFORM_WALLET_ID = process.env.PLATFORM_WALLET_ID || 'platform_wallet_main';

async function upsertSeedUser({ email, password, role, firstName, lastName, clientProfile }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const verifiedAt = new Date();

  return prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role,
      firstName,
      lastName,
      emailVerifiedAt: verifiedAt,
    },
    create: {
      email,
      password: passwordHash,
      role,
      firstName,
      lastName,
      emailVerifiedAt: verifiedAt,
      ...(clientProfile ? { clientProfile: { create: {} } } : {}),
    },
    select: { id: true, email: true, role: true },
  });
}

async function main() {
  await prisma.platformWallet.upsert({
    where: { id: PLATFORM_WALLET_ID },
    update: {},
    create: {
      id: PLATFORM_WALLET_ID,
    },
  });

  const feeCount = await prisma.platformFeeConfig.count();
  if (feeCount === 0) {
    await prisma.platformFeeConfig.create({
      data: {
        clientFeeBps: 500,
        providerFeeBps: 500,
        effectiveFrom: new Date(),
      },
    });
  }

  const demoEmail = process.env.SEED_DEMO_EMAIL || 'demo@hackersdeal.com';
  const demoPassword = process.env.SEED_DEMO_PASSWORD || 'demo12345';
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@hackersdeal.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin12345!';

  const demoUser = await upsertSeedUser({
    email: demoEmail,
    password: demoPassword,
    role: UserRole.CLIENT,
    firstName: 'Demo',
    lastName: 'Client',
    clientProfile: true,
  });

  const adminUser = await upsertSeedUser({
    email: adminEmail,
    password: adminPassword,
    role: UserRole.ADMIN,
    firstName: 'Platform',
    lastName: 'Admin',
    clientProfile: false,
  });

  console.log('Seed complete');
  console.log('');
  console.log('Demo client (CLIENT role):');
  console.log(`  Email:    ${demoEmail}`);
  console.log(`  Password: ${demoPassword}`);
  console.log(`  User ID:  ${demoUser.id}`);
  console.log('');
  console.log('Admin (ADMIN role — use for /dashboard/admin/reports):');
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  User ID:  ${adminUser.id}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
