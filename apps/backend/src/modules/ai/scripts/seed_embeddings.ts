import { Client } from 'pg';
import * as fs from 'fs';

// 1️⃣ Read the sample dataset
const data = JSON.parse(
  fs.readFileSync(
    'apps/backend/src/modules/ai/data/sample-tourism.json',
    'utf8',
  ),
);

// 2️⃣ Function to generate a dummy vector of 1536 numbers
function generateDummyVector(length: number) {
  return Array.from({ length }, () => +Math.random().toFixed(3));
}

async function seed() {
  // 3️⃣ Connect to Postgres
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

    // Convert JS array → SQL vector format '{1,2,3,...}'
    const vectorString = '[' + embedding.join(',') + ']';

    await client.query(
      'INSERT INTO embeddings (text, embedding) VALUES ($1, $2)',
      [text, vectorString],
    );

    console.log(`Inserted embedding for: ${item.title}`);
  }

  await client.end();
  console.log('Seeding completed!');
}

seed();
