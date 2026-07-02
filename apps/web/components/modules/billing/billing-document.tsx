/**
 * @file components/modules/billing/billing-document.tsx
 * @description Print/PDF-ready A4 document rendered from an Invoice or a Quote.
 * Mirrors the ZERPA_BILLING_SPEC layout: logo + metadata header, FROM / TO
 * address blocks, 7-column line-items table, totals block, bank details and a
 * bold BALANCE DUE. Template flags switch INVOICE ↔ QUOTATION, DUE DATE ↔ VALID
 * UNTIL, and hide the bank/balance blocks on quotes (scope/terms shown instead).
 *
 * Uses explicit colours (not CSS-var tokens) so it prints faithfully.
 */
"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { computeLineTotal } from "@/lib/utils/billing-calc";
import type {
  BillingCustomer,
  BillingLineItem,
  BillingSettings,
  Invoice,
  Quote,
} from "@zerpa/shared-types";

type DocKind = "invoice" | "quote";

interface BillingDocumentProps {
  kind: DocKind;
  invoice?: Invoice;
  quote?: Quote;
  settings: BillingSettings;
  customer?: BillingCustomer | null;
}

interface NormalisedDoc {
  number: string;
  reference?: string | null;
  issueDate: string;
  secondDateLabel: string;
  secondDate: string;
  salesRep?: string | null;
  overallDiscountPct: number;
  customerName: string;
  subject?: string | null;
  scopeOfWork?: string | null;
  paymentTerms?: string | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  lineItems: BillingLineItem[];
  subtotal: number;
  discountAmount: number;
  taxTotal: number;
  total: number;
  balanceDue?: number;
  fromQuoteNumber?: string | null;
}

function normalise(props: BillingDocumentProps): NormalisedDoc {
  const { kind, invoice, quote } = props;
  if (kind === "quote" && quote) {
    return {
      number: quote.quoteNumber,
      reference: quote.reference,
      issueDate: quote.issueDate,
      secondDateLabel: "VALID UNTIL",
      secondDate: quote.expiryDate,
      salesRep: quote.salesRep,
      overallDiscountPct:
        quote.discountType === "percent" ? quote.discountValue : 0,
      customerName: quote.customerName,
      subject: quote.subject,
      scopeOfWork: quote.scopeOfWork,
      paymentTerms: quote.paymentTerms,
      termsAndConditions: quote.termsAndConditions,
      notes: quote.notes,
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxTotal: quote.taxTotal,
      total: quote.total,
    };
  }
  const inv = invoice as Invoice;
  return {
    number: inv.invoiceNumber,
    reference: inv.reference,
    issueDate: inv.issuedDate,
    secondDateLabel: "DUE DATE",
    secondDate: inv.dueDate,
    salesRep: inv.salesRep,
    overallDiscountPct:
      inv.discountType === "percent" ? inv.discountValue ?? 0 : 0,
    customerName: inv.tenantName,
    subject: inv.subject,
    notes: inv.notes,
    lineItems: inv.lineItems as BillingLineItem[],
    subtotal: inv.subtotal,
    discountAmount: inv.discountAmount ?? 0,
    taxTotal: inv.taxAmount,
    total: inv.total,
    balanceDue: inv.balanceDue ?? inv.total,
    fromQuoteNumber: inv.quoteId ? "converted quote" : null,
  };
}

function AddressBlock({ text }: { text?: string | null }) {
  if (!text) return <span className="text-gray-400">—</span>;
  return (
    <>
      {text.split("\n").map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </>
  );
}

export function BillingDocument(props: BillingDocumentProps) {
  const { kind, settings, customer } = props;
  const doc = normalise(props);
  const isQuote = kind === "quote";
  const label = isQuote ? "QUOTATION" : "INVOICE";

  return (
    <div
      id="billing-print-root"
      className="bg-white text-[#0d0d14] mx-auto"
      style={{ width: "210mm", minHeight: "297mm", padding: "14mm" }}
    >
      {/* Header: logo + metadata */}
      <div className="flex items-start justify-between border-b border-gray-300 pb-5">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logoUrl} alt="Logo" className="h-14 w-auto" />
          ) : (
            <div className="w-12 h-12 rounded-[6px] bg-[#1d3461] text-white flex items-center justify-center font-bold text-2xl">
              Z
            </div>
          )}
          <div>
            <p className="font-semibold text-lg leading-tight">
              {settings.companyName}
            </p>
            {settings.companyVatNumber && (
              <p className="text-xs text-gray-500">
                VAT No: {settings.companyVatNumber}
              </p>
            )}
            {settings.companyRegistrationNumber && (
              <p className="text-xs text-gray-500">
                Reg No: {settings.companyRegistrationNumber}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold tracking-wide">{label}</p>
          <table className="text-xs mt-3 ml-auto">
            <tbody>
              <MetaRow k="NUMBER" v={doc.number} mono />
              {doc.reference && <MetaRow k="REFERENCE" v={doc.reference} />}
              <MetaRow k="DATE" v={formatDate(doc.issueDate, "dd/MM/yyyy")} />
              <MetaRow
                k={doc.secondDateLabel}
                v={formatDate(doc.secondDate, "dd/MM/yyyy")}
              />
              {doc.salesRep && <MetaRow k="SALES REP" v={doc.salesRep} />}
              <MetaRow
                k="OVERALL DISCOUNT %"
                v={`${doc.overallDiscountPct.toFixed(2)}%`}
              />
              <MetaRow k="PAGE" v="1/1" />
            </tbody>
          </table>
        </div>
      </div>

      {doc.fromQuoteNumber && (
        <p className="text-xs text-gray-500 mt-2">
          This invoice was generated from a converted quote.
        </p>
      )}

      {/* FROM / TO */}
      <div className="grid grid-cols-2 gap-6 mt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
            From
          </p>
          <p className="font-semibold">{settings.companyName}</p>
          {settings.companyVatNumber && (
            <p className="text-xs text-gray-600">
              VAT No: {settings.companyVatNumber}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-gray-700">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Postal Address
              </p>
              <AddressBlock text={settings.companyPostalAddress} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Delivery Address
              </p>
              <AddressBlock
                text={
                  settings.companyDeliveryAddress ||
                  settings.companyPostalAddress
                }
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
            To
          </p>
          <p className="font-semibold">{doc.customerName}</p>
          {customer?.vatNumber && (
            <p className="text-xs text-gray-600">
              Customer VAT No: {customer.vatNumber}
            </p>
          )}
          {customer?.contactPerson && (
            <p className="text-xs text-gray-600">{customer.contactPerson}</p>
          )}
          {customer?.contactEmail && (
            <p className="text-xs text-gray-600">{customer.contactEmail}</p>
          )}
          <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-gray-700">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Postal Address
              </p>
              <AddressBlock text={customer?.postalAddress} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-gray-400">
                Delivery Address
              </p>
              <AddressBlock
                text={customer?.deliveryAddress || customer?.postalAddress}
              />
            </div>
          </div>
        </div>
      </div>

      {doc.subject && (
        <p className="mt-4 text-sm">
          <span className="font-semibold">Subject: </span>
          {doc.subject}
        </p>
      )}

      {/* Scope of work (quotes only) */}
      {isQuote && doc.scopeOfWork && (
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Scope of Work
          </p>
          <p className="text-sm whitespace-pre-wrap text-gray-700">
            {doc.scopeOfWork}
          </p>
        </div>
      )}

      {/* Line items */}
      <table className="w-full text-xs mt-5 border-collapse">
        <thead>
          <tr className="bg-[#f3f3ef] text-left">
            <Th>Description</Th>
            <Th className="text-right w-16">Quantity</Th>
            <Th className="text-right w-24">Excl. Price</Th>
            <Th className="text-right w-16">Disc %</Th>
            <Th className="text-right w-16">VAT %</Th>
            <Th className="text-right w-24">Excl. Total</Th>
            <Th className="text-right w-24">Incl. Total</Th>
          </tr>
        </thead>
        <tbody>
          {doc.lineItems.map((it, i) => {
            const exclTotal = computeLineTotal(it);
            const inclTotal = exclTotal * (1 + (it.taxRate ?? 15) / 100);
            return (
              <tr key={it.id ?? i} className="border-b border-gray-200">
                <Td>{it.description}</Td>
                <Td className="text-right font-mono">{it.quantity}</Td>
                <Td className="text-right font-mono">
                  {formatCurrency(it.unitPrice)}
                </Td>
                <Td className="text-right font-mono">
                  {(it.discountPercent ?? 0).toFixed(2)}%
                </Td>
                <Td className="text-right font-mono">
                  {(it.taxRate ?? 15).toFixed(2)}%
                </Td>
                <Td className="text-right font-mono">
                  {formatCurrency(exclTotal)}
                </Td>
                <Td className="text-right font-mono">
                  {formatCurrency(inclTotal)}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bottom: bank details + totals */}
      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="text-xs text-gray-700">
          {/* Bank details (invoices only) */}
          {!isQuote && settings.bankName && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Banking Details
              </p>
              <p>Bank: {settings.bankName}</p>
              <p>Acc Nr: {settings.bankAccountNumber}</p>
              <p>Branch Code: {settings.bankBranchCode}</p>
              <p>Branch Name: {settings.bankBranchName}</p>
              {settings.bankSwiftCode && <p>Swift: {settings.bankSwiftCode}</p>}
              {settings.proofOfPaymentEmail && (
                <p className="mt-2">
                  Proof of payment to: {settings.proofOfPaymentEmail}
                </p>
              )}
            </div>
          )}

          {/* Payment terms (quotes) */}
          {isQuote && doc.paymentTerms && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Payment Terms
              </p>
              <p>{doc.paymentTerms}</p>
            </div>
          )}

          {settings.footerNotes && (
            <p className="mt-3 text-[11px] text-gray-500">
              {settings.footerNotes}
            </p>
          )}
        </div>

        {/* Totals */}
        <div className="ml-auto w-full max-w-xs text-sm">
          <TotalRow k="Total Discount" v={formatCurrency(doc.discountAmount)} />
          <TotalRow
            k="Total Exclusive"
            v={formatCurrency(doc.subtotal - doc.discountAmount)}
          />
          <TotalRow k="Total VAT" v={formatCurrency(doc.taxTotal)} />
          <TotalRow k="Sub Total" v={formatCurrency(doc.subtotal)} />
          <div className="flex justify-between border-t-2 border-gray-800 pt-2 mt-2">
            <span className="font-semibold">Grand Total</span>
            <span className="font-mono font-semibold">
              {formatCurrency(doc.total)}
            </span>
          </div>

          {/* BALANCE DUE (invoices only) */}
          {!isQuote && (
            <div className="flex justify-between items-center mt-3 bg-[#f3f3ef] rounded px-3 py-2">
              <span className="font-bold text-base">BALANCE DUE</span>
              <span className="font-mono font-bold text-2xl">
                {formatCurrency(doc.balanceDue ?? doc.total)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {doc.notes && (
        <div className="mt-6 text-xs text-gray-600">
          <p className="font-semibold mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{doc.notes}</p>
        </div>
      )}

      {/* Terms & conditions (quotes) */}
      {isQuote && doc.termsAndConditions && (
        <div className="mt-4 text-xs text-gray-600">
          <p className="font-semibold mb-1">Terms &amp; Conditions</p>
          <p className="whitespace-pre-wrap">{doc.termsAndConditions}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-[11px] text-gray-500">
        {isQuote ? (
          <p>
            This quotation is valid until{" "}
            {formatDate(doc.secondDate, "dd MMM yyyy")}. To accept, reply to this
            email or contact us.
          </p>
        ) : (
          <p>Thank you for your business.</p>
        )}
      </div>
    </div>
  );
}

function MetaRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr>
      <td className="pr-3 text-gray-500 uppercase tracking-wide align-top">
        {k}:
      </td>
      <td className={`text-left ${mono ? "font-mono font-semibold" : ""}`}>
        {v}
      </td>
    </tr>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-2 py-1.5 font-semibold uppercase tracking-wide text-[10px] text-gray-600 border-b border-gray-300 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-2 py-2 align-top ${className}`}>{children}</td>;
}

function TotalRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-gray-600">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}
