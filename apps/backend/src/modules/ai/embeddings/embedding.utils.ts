export function preprocessQuery(text: string): string {
  if (!text) return '';

  return (
    text
      .toLowerCase()
      // Keep ONLY English letters, numbers, and spaces
      .replace(/[^a-z0-9\s]/g, ' ')
      // Normalize spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}
