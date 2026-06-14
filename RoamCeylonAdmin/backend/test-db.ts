import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { email: 'it24101009@my.sliit.lk' } });
  console.log(users);
}
main().catch(console.error).finally(() => prisma.$disconnect());
