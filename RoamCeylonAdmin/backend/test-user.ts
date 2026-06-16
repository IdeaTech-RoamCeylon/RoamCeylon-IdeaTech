import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { id: "test-id" } });
    console.log("findUnique user:", user);
    if (!user) {
      const created = await prisma.user.create({ data: { id: "test-id" } });
      console.log("Created user:", created);
    }
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
