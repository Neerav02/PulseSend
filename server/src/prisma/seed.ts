import { initDatabase, prisma } from '../config/database';
import { encrypt } from '../utils/encryption';
import { logger } from '../utils/logger';

async function seed() {
  logger.info('Seeding PulseSend database with initial demonstration assets...');

  // Initialize schema tables if not present
  await initDatabase();

  // 1. Create or Find Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { name: 'Outbox Labs Demo Workspace' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: 'Outbox Labs Demo Workspace' },
    });
  }

  // 2. Create Default Owner User
  let user = await prisma.user.findUnique({
    where: { email: 'babelneerav299@gmail.com' },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'babelneerav299@gmail.com',
        name: 'Neerav Babel',
        avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Neerav+Babel',
        role: 'OWNER',
        tenantId: tenant.id,
      },
    });
  }

  // 3. Create Sample Sender Mailboxes
  const sampleSenders = [
    {
      displayName: 'ReachInbox Enterprise Sales',
      email: 'sales@reachinbox.ai',
      hourlyLimit: 50,
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      smtpUser: 'ethereal_user_sales',
      smtpPassword: encrypt('demo_password_123'),
    },
    {
      displayName: 'Outbox Labs Partnerships',
      email: 'partnerships@outboxlabs.com',
      hourlyLimit: 60,
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      smtpUser: 'ethereal_user_partnerships',
      smtpPassword: encrypt('demo_password_123'),
    },
    {
      displayName: 'ReachInbox Growth',
      email: 'growth@reachinbox.ai',
      hourlyLimit: 50,
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      smtpUser: 'ethereal_user_growth',
      smtpPassword: encrypt('demo_password_123'),
    },
  ];

  for (const s of sampleSenders) {
    const existing = await prisma.senderAccount.findFirst({
      where: { tenantId: tenant.id, email: s.email },
    });
    if (!existing) {
      await prisma.senderAccount.create({
        data: {
          tenantId: tenant.id,
          ...s,
        },
      });
      logger.info(`Seeded sender mailbox: ${s.email} (${s.hourlyLimit} emails/hr)`);
    }
  }

  logger.info('Database seeding completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});

