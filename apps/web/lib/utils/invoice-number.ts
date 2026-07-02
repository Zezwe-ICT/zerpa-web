// Invoice number generation: ZRP-YYYY-XXXX format
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
  return `ZRP-${year}-${sequence}`;
}

export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const match = invoiceNumber.match(/^(ZRP)-(\d{4})-(\d{4})$/);
  if (!match) return null;

  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}

export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  return /^ZRP-\d{4}-\d{4}$/.test(invoiceNumber);
}

/**
 * Generate a document number for a given prefix.
 * Format: PREFIX-YYYY-XXXX (e.g. "INV-2026-0042", "QUO-2026-0011").
 *
 * `nextSequence` should be the next sequence for the current year; when omitted
 * a pseudo-random 4-digit sequence is used (mock/demo mode).
 */
export function generateDocumentNumber(
  prefix: string,
  nextSequence?: number
): string {
  const year = new Date().getFullYear();
  const seq = nextSequence ?? Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

/** Convenience: next INV-YYYY-XXXX invoice number. */
export function generateInvoiceDocumentNumber(nextSequence?: number): string {
  return generateDocumentNumber("INV", nextSequence);
}

/** Convenience: next QUO-YYYY-XXXX quote number. */
export function generateQuoteNumber(nextSequence?: number): string {
  return generateDocumentNumber("QUO", nextSequence);
}

/**
 * Given existing numbers sharing a prefix, return the next sequence for the
 * current year (max + 1, starting at 1). Keeps mock numbering gap-free.
 */
export function nextSequenceForYear(
  existingNumbers: string[],
  prefix: string
): number {
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const max = existingNumbers.reduce((acc, num) => {
    const m = num.match(re);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return max + 1;
}
