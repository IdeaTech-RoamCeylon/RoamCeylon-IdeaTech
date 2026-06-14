import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const pkgs = await prisma.tourPackage.findMany();
  console.log(pkgs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
