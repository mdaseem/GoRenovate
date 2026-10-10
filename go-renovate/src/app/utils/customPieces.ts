// The Customize tab's room is an ordered list of essential ids in which the
// same id may appear more than once (two bedside tables = the id twice). Each
// occurrence is its own draggable "piece" in the preview, identified by a key
// derived from the id and which occurrence it is — so keys stay stable as
// long as pieces are only added/removed from the END of an id's occurrences
// (which is all the UI does).

export const MAX_QUANTITY_PER_PIECE = 10;

export interface CustomPiece {
  // Unique per occurrence, e.g. "64f…a1#0", "64f…a1#1".
  key: string;
  essentialId: string;
}

export function pieceKey(essentialId: string, occurrence: number): string {
  return `${essentialId}#${occurrence}`;
}

export function buildPieces(essentialIds: string[]): CustomPiece[] {
  const seen = new Map<string, number>();
  return essentialIds.map((essentialId) => {
    const occurrence = seen.get(essentialId) ?? 0;
    seen.set(essentialId, occurrence + 1);
    return { key: pieceKey(essentialId, occurrence), essentialId };
  });
}

export function countById(essentialIds: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of essentialIds) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
}

// Distinct ids in the order they were first added.
export function uniqueIds(essentialIds: string[]): string[] {
  return Array.from(new Set(essentialIds));
}
