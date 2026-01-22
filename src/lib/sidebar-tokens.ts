/**
 * Token rules for sidebar features (Document Drafting, Research, Upload, etc.):
 * - 5 tokens per task when output ≤ 1 page
 * - 7 tokens per page when document is beyond one page (long)
 *
 * AI Legal Chat continues to use 1 token per message.
 */

export const TOKENS_PER_SIDEBAR_TASK = 5;

/** Shown when user has no tokens (before or after generation). Opens subscription modal so they can purchase. */
export const TOKENS_DONE_TITLE = 'Tokens used up';
export const TOKENS_DONE_MESSAGE = 'Your tokens are done. Purchase to continue generating the document you want.';
export const TOKENS_PER_PAGE_LONG = 7;
/** ~3000 chars ≈ 1 page (≈500 words) */
export const CHARS_PER_PAGE = 3000;

/**
 * Compute tokens for a sidebar task from output length.
 * ≤1 page → 5 tokens; >1 page → 7 tokens per page.
 */
export function computeSidebarTaskTokens(outputLength: number): number {
  const pages = Math.max(1, Math.ceil(outputLength / CHARS_PER_PAGE));
  return pages <= 1 ? TOKENS_PER_SIDEBAR_TASK : pages * TOKENS_PER_PAGE_LONG;
}
