const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activity = await prisma.activity.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log(activity);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
