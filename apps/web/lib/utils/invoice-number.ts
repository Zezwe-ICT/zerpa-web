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
