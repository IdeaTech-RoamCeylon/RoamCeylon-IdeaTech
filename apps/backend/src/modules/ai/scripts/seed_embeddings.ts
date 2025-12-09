/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Client } from 'pg';
import * as fs from 'fs';

// 1️⃣ Define types for your JSON data
interface TourismItem {
  title: string;
  description: string;
}

interface TourismData {
  tourism_samples: TourismItem[];
}

// 2️⃣ Read the sample dataset and cast to the correct type
const data: TourismData = JSON.parse(
  fs.readFileSync('./src/modules/ai-planner/data/sample-tourism.json', 'utf8'),
);

// 3️⃣ Function to generate a dummy vector of 1536 numbers
function generateDummyVector(length: number): number[] {
  return Array.from({ length }, () => +Math.random().toFixed(3));
}

async function seed() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'roam_ceylon',
  });

  await client.connect();
  console.log('Connected to database!');

  for (const item of data.tourism_samples) {
    const text = item.description;
    const embedding = generateDummyVector(1536);

    // Convert JS array → SQL vector format '[1,2,3,...]'
    const vectorString = '[' + embedding.join(',') + ']';

    await client.query(
      'INSERT INTO embeddings (content, embedding) VALUES ($1, $2::vector)',
      [text, vectorString],
    );

    console.log(`Inserted embedding for: ${item.title}`);
  }

  await client.end();
  console.log('Seeding completed!');
}

// Run the seeding script
seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
