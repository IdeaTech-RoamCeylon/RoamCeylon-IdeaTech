// apps/backend/scripts/generate_500_places.ts
import * as fs from 'fs';
import * as path from 'path';

const tourismFilePath = path.join(__dirname, '../src/modules/ai/data/sample-tourism.json');

interface TourismSample {
  title: string;
  description: string;
  near: string[];
  region: string;
}

// 25 realistic towns/hubs in Sri Lanka mapped to their regions
const TOWNS = [
  { name: 'Galle', region: 'south' },
  { name: 'Unawatuna', region: 'south' },
  { name: 'Hikkaduwa', region: 'south' },
  { name: 'Mirissa', region: 'south' },
  { name: 'Bentota', region: 'south' },
  { name: 'Tangalle', region: 'south' },
  { name: 'Weligama', region: 'south' },
  { name: 'Matara', region: 'south' },
  { name: 'Sigiriya', region: 'cultural_triangle' },
  { name: 'Dambulla', region: 'cultural_triangle' },
  { name: 'Anuradhapura', region: 'cultural_triangle' },
  { name: 'Polonnaruwa', region: 'cultural_triangle' },
  { name: 'Habarana', region: 'cultural_triangle' },
  { name: 'Kandy', region: 'kandy' },
  { name: 'Peradeniya', region: 'kandy' },
  { name: 'Matale', region: 'kandy' },
  { name: 'Ella', region: 'hill_country' },
  { name: 'Nuwara Eliya', region: 'hill_country' },
  { name: 'Haputale', region: 'hill_country' },
  { name: 'Hatton', region: 'hill_country' },
  { name: 'Badulla', region: 'hill_country' },
  { name: 'Yala', region: 'safari_south' },
  { name: 'Udawalawe', region: 'safari_south' },
  { name: 'Trincomalee', region: 'east_coast' },
  { name: 'Arugam Bay', region: 'east_coast' },
  { name: 'Nilaveli', region: 'east_coast' },
  { name: 'Jaffna', region: 'north' },
  { name: 'Mannar', region: 'north' },
  { name: 'Colombo', region: 'west' },
  { name: 'Negombo', region: 'west' }
];

const MODIFIERS = [
  'Hidden',
  'Sacred',
  'Pristine',
  'Royal',
  'Historic',
  'Wild',
  'Ancient',
  'Sunset',
  'Scenic',
  'Upper',
  'Lower',
  'Old Colonial',
  'Tropical',
  'Whispering',
  'Majestic'
];

const ATTRACTION_TEMPLATES = [
  {
    suffix: 'Viewpoint Peak',
    description: 'A breathtaking high-altitude viewpoint in the {town} region, offering sweeping panoramic vistas of the valleys, tea estates, and surrounding mountain ranges.'
  },
  {
    suffix: 'Vihara',
    description: 'A serene historical Buddhist temple located in the hills of {town}, featuring ancient stone stupas, religious murals, and a tranquil space for meditation.'
  },
  {
    suffix: 'Secret Beach Cove',
    description: 'A pristine, hidden coastal inlet near {town} bordered by leaning coconut palms, offering soft golden sands, quiet waves, and exceptional snorkeling spots.'
  },
  {
    suffix: 'Waterfalls Valley',
    description: 'A spectacular natural canyon in the {town} forests containing multiple cascading waterfalls, rock pools for cooling baths, and scenic hiking trails.'
  },
  {
    suffix: 'Ayurvedic Gardens',
    description: 'A lush agricultural sanctuary near {town} showcasing organic cinnamon, cardamom, vanilla, and traditional Ayurvedic herbs with local guided tours.'
  },
  {
    suffix: 'Jeep Safari Trail',
    description: 'An adventurous wild track in {town} popular for wildlife sightings, dry-zone grasslands, elephant paths, and guided off-road jeep expeditions.'
  },
  {
    suffix: 'Colonial Manor House',
    description: 'A beautifully restored 18th-century colonial bungalow in {town}, displaying historic furniture, cobblestone courtyards, and ancient architecture.'
  },
  {
    suffix: 'Coral Reef Snorkeling Point',
    description: 'A vibrant shallow reef sanctuary near {town} bustling with colorful marine life, sea anemones, tropical fish, and green sea turtles.'
  },
  {
    suffix: 'Zipline Adventure Course',
    description: 'A high-flying adventure course in {town} featuring a dual zip-line stretching over lush tea valleys, perfect for thrill-seekers.'
  },
  {
    suffix: 'Sacred Rock Caves',
    description: 'A series of ancient meditation caves carved directly into the hillsides of {town}, housing centuries-old rock murals and serene Buddha statues.'
  },
  {
    suffix: 'Tea Tasting Plantation',
    description: 'An elegant terraced tea plantation in {town} where visitors can pluck organic tea leaves, tour the old factories, and sample premium Ceylon tea varieties.'
  },
  {
    suffix: 'Mangrove Lagoon Safari',
    description: 'A peaceful boat cruise along the swamp rivers of {town}, weaving through thick mangrove tunnels, spotting water monitors, and visiting islands.'
  },
  {
    suffix: 'Kovil Sanctuary',
    description: 'A beautiful and colorful Hindu shrine in {town} dedicated to deities, featuring high tower gates (gopurams) and lively daily evening prayer rituals.'
  },
  {
    suffix: 'Strict Nature Reserve',
    description: 'A strictly protected evergreen dry-zone forest reserve near {town}, boasting rich avian biodiversity, wild hornbills, and hidden stone ruins.'
  },
  {
    suffix: 'Lighthouse Cliff',
    description: 'A dramatic coastal headland in {town} featuring an active white-washed lighthouse with views stretching out over the deep ocean waves.'
  }
];

function generatePlaces() {
  console.log('Reading existing hand-crafted places from sample-tourism.json...');
  
  let existingData: { tourism_samples: TourismSample[] } = { tourism_samples: [] };
  if (fs.existsSync(tourismFilePath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(tourismFilePath, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse existing JSON, using empty template:', e);
    }
  }

  const existingCount = existingData.tourism_samples.length;
  console.log(`Located ${existingCount} existing places.`);

  if (existingCount >= 500) {
    console.log('Database already has 500+ items. No need to generate more!');
    return;
  }

  const needed = 500 - existingCount;
  console.log(`Generating ${needed} additional unique places to reach exactly 500...`);

  const generatedSamples: TourismSample[] = [];
  const seenTitles = new Set<string>(existingData.tourism_samples.map((s) => s.title.toLowerCase()));

  let townIndex = 0;
  let templateIndex = 0;
  let modifierIndex = 0;

  while (generatedSamples.length < needed) {
    const town = TOWNS[townIndex];
    const template = ATTRACTION_TEMPLATES[templateIndex];
    const modifier = MODIFIERS[modifierIndex];

    const title = `${modifier} ${town.name} ${template.suffix}`;
    const titleLower = title.toLowerCase();

    if (!seenTitles.has(titleLower)) {
      seenTitles.add(titleLower);

      const description = template.description.replace(/{town}/g, town.name);
      
      // Proximity list: include the town itself, plus other towns in the same region
      const sameRegionTowns = TOWNS.filter((t) => t.region === town.region && t.name !== town.name)
        .map((t) => t.name.toLowerCase());
      
      // Take up to 2 other nearby towns
      const near = [town.name.toLowerCase(), ...sameRegionTowns.slice(0, 2)];

      generatedSamples.push({
        title,
        description,
        near,
        region: town.region
      });
    }

    // Cycle through combinations deterministically
    townIndex = (townIndex + 1) % TOWNS.length;
    if (townIndex === 0) {
      templateIndex = (templateIndex + 1) % ATTRACTION_TEMPLATES.length;
      if (templateIndex === 0) {
        modifierIndex = (modifierIndex + 1) % MODIFIERS.length;
      }
    }
  }

  const finalCombinedList = [...existingData.tourism_samples, ...generatedSamples];
  
  fs.writeFileSync(
    tourismFilePath,
    JSON.stringify({ tourism_samples: finalCombinedList }, null, 2),
    'utf-8'
  );

  console.log(`Successfully generated and wrote ${generatedSamples.length} new places!`);
  console.log(`sample-tourism.json now has exactly ${finalCombinedList.length} tourism entries!`);
}

generatePlaces();
