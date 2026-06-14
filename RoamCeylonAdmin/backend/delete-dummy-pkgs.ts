import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.tourPackage.deleteMany({});
  console.log('All dummy packages deleted successfully.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
