import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function generateDummyEmbedding(dim = 1536): number[] {
  return Array.from({ length: dim }, () => Math.random());
}

const samples = [
  { text: "Sigiriya is an ancient rock fortress located in the central province of Sri Lanka, known for its frescoes and the Lion Gate." },
  { text: "Yala National Park is famous for wildlife, especially leopards, elephants, and diverse bird species." },

  { text: "Ella is a scenic hill town surrounded by lush tea plantations, hiking trails, and iconic views like the Nine Arches Bridge." },
  { text: "Kandy is home to the Temple of the Tooth Relic, a sacred Buddhist site attracting thousands of pilgrims." },
  { text: "Galle Fort is a historic Dutch fortification featuring colonial architecture, cobblestone streets, and ocean viewpoints." },
  { text: "Mirissa is a popular beach destination known for whale watching, surfing, and palm-lined shores." },
  { text: "Anuradhapura is an ancient kingdom filled with well-preserved stupas, sacred temples, and archaeological ruins." },
  { text: "Jaffna offers rich Tamil culture, unique cuisine, historic temples, and the beautiful Jaffna Fort." },
  { text: "Nuwara Eliya, often called 'Little England', features cool climate, tea estates, and colonial architecture." },
  { text: "Arugam Bay is world-famous for surfing, attracting both local and international surfers throughout the year." },
  { text: "Polonnaruwa showcases ancient royal palaces, statues, and the impressive Gal Vihara stone Buddha sculptures." },
  { text: "Trincomalee is known for its stunning beaches, marine life, and the ancient Koneswaram Temple." },
  { text: "Haputale offers panoramic viewpoints, cloud forests, and tea plantations such as Lipton's Seat." },
  { text: "Bentota is a coastal town popular for luxury resorts, water sports, and calm sandy beaches." },
  { text: "Wilpattu National Park is one of Sri Lanka's oldest parks, famous for natural lakes and diverse wildlife." },
  { text: "Colombo is the commercial capital featuring modern city life, historic buildings, shopping, and vibrant nightlife." },
  { text: "Dambulla Cave Temple consists of beautifully preserved cave paintings and Buddha statues dating back centuries." }
];

async function main() {
  for (const sample of samples) {
    const vector = generateDummyEmbedding(1536); 
    const vectorString = '[' + vector.join(',') + ']';
    await prisma.$executeRawUnsafe(
      `INSERT INTO embeddings (text, embedding) VALUES ($1, $2::vector)`,
      sample.text,
      vectorString
    );
  }
}


main().finally(() => prisma.$disconnect());