import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const descriptions = [
        'Beautiful sandy beaches with crystal clear water.',
        'Ancient ruins from the 12th century.',
        'Lush green tea plantations in the hill country.',
        'Wildlife safari with elephants and leopards.',
        'Bustling city life with vibrant markets.',
        'Serene temples and religious sites.',
        'Scenic train rides through the mountains.',
        'Delicious local cuisine and street food.',
        'Surfing spots with great waves.',
        'Relaxing ayurvedic spas and wellness centers.',
    ];

    for (const text of descriptions) {
        // Generate a random 1536-dimensional vector
        const vector = Array.from({ length: 1536 }, () => Math.random());
        const vectorString = `[${vector.join(',')}]`;

        await prisma.$executeRaw`INSERT INTO embeddings (text, embedding) VALUES (${text}, ${vectorString}::vector)`;
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
