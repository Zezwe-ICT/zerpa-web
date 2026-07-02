/**
 * @file lib/mock/billing-settings.ts
 * @description Seed for the singleton BillingSettings. Feeds document numbering,
 * default VAT/terms and the FROM / bank-details blocks on invoice & quote PDFs.
 */
import type { BillingSettings } from "@zerpa/shared-types";

export const MOCK_BILLING_SETTINGS: BillingSettings = {
  invoicePrefix: "INV",
  quotePrefix: "QUO",
  defaultPaymentTermsDays: 30,
  defaultVatRate: 15,
  defaultQuoteValidityDays: 30,
  invoiceEmailSubjectTemplate: "Invoice {invoice_number} from Zerpa ICT",
  invoiceEmailBodyTemplate:
    "Dear {client_name},\n\nPlease find attached invoice {invoice_number} for {total}, due {due_date}.\n\nKind regards,\nZerpa ICT Billing Team",
  quoteEmailSubjectTemplate: "Quotation {quote_number} from Zerpa ICT",
  companyName: "Zerpa ICT (Pty) Ltd",
  companyVatNumber: "4123456789",
  companyRegistrationNumber: "2019/123456/07",
  companyPostalAddress: "123 Business Park\nSandton\nJohannesburg\n2196",
  companyDeliveryAddress: "123 Business Park\nSandton\nJohannesburg\n2196",
  bankName: "FNB",
  bankAccountNumber: "62 800 123 456",
  bankBranchCode: "250655",
  bankBranchName: "Sandton City",
  bankSwiftCode: "FIRNZAJJ",
  proofOfPaymentEmail: "billing@zerpa.co.za",
  logoUrl: "",
  footerNotes: "Please note that some products are NON-REFUNDABLE.",
  overdueReminderDays: [3, 7, 14, 30],
};
