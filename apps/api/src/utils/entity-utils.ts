export function normalizeEntityName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s&'-]/g, '')
    .toLowerCase();
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeEntityName(str1);
  const s2 = normalizeEntityName(str2);

  if (s1 === s2) return 1.0;

  // Check if one is contained in the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    return shorter.length / longer.length;
  }

  // Simple Jaccard similarity on words
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

export function shouldMergeEntities(
  name1: string,
  name2: string,
  threshold: number = 0.8
): boolean {
  return calculateSimilarity(name1, name2) >= threshold;
}

export function selectCanonicalName(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];

  // Prefer the longest name (usually most complete)
  return names.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}

export function extractContextSnippet(
  text: string,
  entityName: string,
  contextLength: number = 100
): string {
  const normalizedText = text.toLowerCase();
  const normalizedEntity = entityName.toLowerCase();

  const index = normalizedText.indexOf(normalizedEntity);

  if (index === -1) {
    // Entity not found, return beginning of text
    return text.substring(0, contextLength).trim() + '...';
  }

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + entityName.length + contextLength / 2);

  let snippet = text.substring(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet.trim();
}
