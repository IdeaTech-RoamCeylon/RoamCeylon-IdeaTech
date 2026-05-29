const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/modules/ai/data/sample-tourism.json');
const rawText = fs.readFileSync(filePath, 'utf8');

console.log('Reading malformed file, length:', rawText.length, 'characters');

const extractedPlaces = [];
const seenTitles = new Set();

let index = 0;
while (index < rawText.length) {
  const startChar = rawText[index];
  
  if (startChar === '{') {
    let braceCount = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;
    
    for (let i = index; i < rawText.length; i++) {
      const char = rawText[i];
      
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            endIdx = i;
            break;
          }
        }
      }
    }
    
    if (endIdx !== -1) {
      const jsonCandidate = rawText.substring(index, endIdx + 1);
      try {
        const parsed = JSON.parse(jsonCandidate);
        
        if (parsed && typeof parsed.title === 'string' && typeof parsed.description === 'string') {
          const cleanTitle = parsed.title.trim();
          if (!seenTitles.has(cleanTitle.toLowerCase())) {
            seenTitles.add(cleanTitle.toLowerCase());
            extractedPlaces.push({
              title: cleanTitle,
              description: parsed.description.trim(),
              near: Array.isArray(parsed.near) ? parsed.near.map(n => String(n).trim().toLowerCase()) : [],
              region: typeof parsed.region === 'string' ? parsed.region.trim().toLowerCase() : 'south'
            });
          }
        }
      } catch (e) {
        // Not a valid standalone JSON object, skip
      }
      index = endIdx;
    }
  }
  index++;
}

console.log('Extracted', extractedPlaces.length, 'unique places.');

if (extractedPlaces.length > 0) {
  extractedPlaces.sort((a, b) => a.title.localeCompare(b.title));
  
  const cleanJson = {
    tourism_samples: extractedPlaces
  };
  
  fs.writeFileSync(filePath, JSON.stringify(cleanJson, null, 2), 'utf8');
  console.log('Successfully repaired and formatted the JSON file on disk!');
} else {
  console.error('Could not extract any valid places!');
}
