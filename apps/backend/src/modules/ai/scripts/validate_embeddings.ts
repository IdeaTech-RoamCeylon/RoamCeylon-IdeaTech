import { Client } from 'pg';

const EXPECTED_DIM = 1536;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'roam_ceylon',
});

async function validateEmbeddings() {
  await client.connect();

  // Cast embedding to text so we always get a string
  const res = await client.query('SELECT id, embedding::text AS embedding FROM embeddings');
  let allValid = true;

  for (const row of res.rows) {
    let vector: number[] | null = null;
    try {
      // Remove brackets and split by comma, then convert to numbers
      vector = row.embedding
        .replace(/^\[|\]$/g, '') // remove leading/trailing brackets
        .split(',')
        .map(v => Number(v.trim()));
    } catch {
      vector = null;
    }
    if (!Array.isArray(vector)) {
      console.error(`Row ${row.id}: Not an array`);
      allValid = false;
      continue;
    }
    if (vector.length !== EXPECTED_DIM) {
      console.error(`Row ${row.id}: Wrong length (${vector.length})`);
      allValid = false;
    }
    if (!vector.every(v => typeof v === 'number' && !isNaN(v))) {
      console.error(`Row ${row.id}: Non-numeric value detected`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log('All embeddings are valid!');
  } else {
    console.log('Some embeddings are invalid. See errors above.');
  }

  await client.end();
}

validateEmbeddings();