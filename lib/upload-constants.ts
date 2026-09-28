// Shared between app/api/papers/route.ts (server-side enforcement) and
// app/upload-papers/page.tsx (client-side pre-validation) so the two never
// drift out of sync.

// Upper bound on page count so a single request can't force unbounded
// in-memory buffering while pdf-lib assembles the merged PDF.
export const MAX_MERGE_FILES = 10

// Aggregate budget for a multi-file merge, independent of the 10MB-per-file
// cap (that cap alone would let a 10-page upload balloon past 100MB).
export const MAX_MERGE_TOTAL_BYTES = 30 * 1024 * 1024
