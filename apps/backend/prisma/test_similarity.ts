import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Querying top 3 similar embeddings...');

    // Generate a random query vector (1536-dim)
    const queryVector = Array.from({ length: 1536 }, () => Math.random());
    const vectorString = `[${queryVector.join(',')}]`;

    // Query top 3 closest embeddings using pgvector
    const topMatches = await prisma.$queryRawUnsafe(
        `SELECT text 
         FROM embeddings
         ORDER BY embedding <-> $1::vector
         LIMIT 3`,
        vectorString
    );

    console.log('Top 3 matches:');
    console.table(topMatches);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });