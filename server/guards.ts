export function duplicateReviewRequired(
  candidateCount: number,
  confirmedNotDuplicate: boolean
) {
  return candidateCount > 0 && !confirmedNotDuplicate;
}

export function idempotentReplay<T>(existing: T | undefined) {
  return existing
    ? { transaction: existing, replayed: true as const }
    : undefined;
}
