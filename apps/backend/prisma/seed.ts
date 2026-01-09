import { PrismaClient } from '@prisma/client';
import tourismData from '../src/modules/ai-planner/data/sample-tourism.json';

const prisma = new PrismaClient();

/**
 * Generates a deterministic "embedding" for demo consistency.
 * In a real app, this would come from an OpenAI/Gemini API.
 */
function generateDeterministicEmbedding(text: string, dim = 1536): number[] {
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Array.from({ length: dim }, (_, i) => Math.abs(Math.sin(seed + i)));
}

async function main() {
  console.log('--- Starting Demo Data Seed ---');

  // 1. Clear existing dynamic data to ensure a fresh demo state
  await prisma.driverLocation.deleteMany({});
  await prisma.rideRequest.deleteMany({});
  await prisma.embeddings.deleteMany({});
  console.log('✅ Cleared existing dynamic data.');

  // 2. Seed AI Planner Embeddings (from curated dataset)
  console.log('Seeding AI Planner embeddings...');
  for (const item of tourismData.tourism_samples) {
    const vector = generateDeterministicEmbedding(item.description);
    const vectorString = '[' + vector.join(',') + ']';

    await prisma.$executeRawUnsafe(
      `INSERT INTO embeddings (text, embedding) VALUES ($1, $2::vector)`,
      `${item.title}: ${item.description}`,
      vectorString
    );
  }
  console.log(`✅ Seeded ${tourismData.tourism_samples.length} AI Travel Locations.`);

  // 3. Seed Demo Driver Locations (Strategically placed for demo coordinates)
  // Locations: Colombo (Galle Face), Kandy (Temple of Tooth), Galle (Fort)
  const demoDrivers = [
    { id: 'driver-colombo-1', lat: 6.9271, lng: 79.8612, name: 'Arjun - Colombo Central' },
    { id: 'driver-colombo-2', lat: 6.9350, lng: 79.8550, name: 'Nuwan - Galle Face Area' },
    { id: 'driver-kandy-1', lat: 7.2906, lng: 80.6337, name: 'Saman - Kandy City' },
    { id: 'driver-galle-1', lat: 6.0329, lng: 80.2168, name: 'Kasun - Galle Fort' },
    { id: 'driver-galle-2', lat: 6.0400, lng: 80.2200, name: 'Tharindu - Unawatuna' },
  ];

  console.log('Seeding strategic Driver locations...');
  for (const driver of demoDrivers) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "DriverLocation" ("driverId", location, "updatedAt") 
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), NOW())`,
      driver.id,
      driver.lng, // Longitude first in ST_MakePoint
      driver.lat
    );
  }
  console.log('✅ Seeded 5 strategic drivers in Colombo, Kandy, and Galle.');

  // 4. Seed a "Pending Ride" for UI Demonstration
  await prisma.$executeRawUnsafe(
    `INSERT INTO "RideRequest" ("passengerId", "pickupLocation", "destination", status, "createdAt")
     VALUES ($1, ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326), ST_SetSRID(ST_MakePoint(79.8700, 6.9300), 4326), 'PENDING', NOW())`,
    'demo-passenger-1'
  );
  console.log('✅ Seeded 1 Pending Ride Request for UI demo.');

  console.log('--- Demo Data Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });