export function preprocessQuery(text: string): string {
  if (!text) return '';
  const noPunct = text.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
  return noPunct.toLowerCase().trim();
}
