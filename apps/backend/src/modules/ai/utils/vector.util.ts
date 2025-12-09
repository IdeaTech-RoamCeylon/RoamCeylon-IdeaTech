export function generateVector(text: string): number[] {
  // Dummy vector generator
  const vector = new Array(1536).fill(0).map((_, i) => {
    return (text.charCodeAt(i % text.length) % 100) / 100;
  });
  return vector;
}
