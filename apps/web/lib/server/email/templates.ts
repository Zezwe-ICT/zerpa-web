/**
 * @file lib/server/email/templates.ts
 * @description Server-only HTML/text builders for Zerpa's transactional emails.
 * Kept framework-free (inline styles, tables) for broad email-client support.
 */
import type { Invoice } from "@zerpa/shared-types";

const BRAND = process.env.SES_FROM_NAME || process.env.NEXT_PUBLIC_APP_NAME || "Zerpa";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://app.zerpa.co.za").replace(/\/$/, "");
const PRIMARY = "#4f46e5";

/** Verified sending domain, derived from the configured From address. */
const FROM_DOMAIN =
  (process.env.SES_FROM_EMAIL || process.env.SES_FROM_ADDRESS || "no-reply@zerpa.co.za").split("@")[1] ||
  "zerpa.co.za";

/** Role From-addresses (overridable). Domain is SES-verified, so any address works. */
export const BILLING_FROM_EMAIL = process.env.SES_BILLING_FROM_EMAIL || `billing@${FROM_DOMAIN}`;
export const SALES_FROM_EMAIL = process.env.SES_SALES_FROM_EMAIL || `sales@${FROM_DOMAIN}`;

/** Build an RFC 5322 From/display-name header value: `"Name" <email>`. */
export function formatFrom(name: string | undefined, email: string): string {
  const clean = name?.trim().replace(/"/g, "");
  return clean ? `"${clean}" <${email}>` : email;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap body HTML in a minimal, email-safe branded shell. */
function layout(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr><td style="background:${PRIMARY};padding:20px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">${escapeHtml(BRAND)}</span>
          </td></tr>
          <tr><td style="padding:28px;color:#18181b;font-size:15px;line-height:1.6;">
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:18px 28px;border-top:1px solid #e4e4e7;color:#a1a1aa;font-size:12px;">
            Sent by ${escapeHtml(BRAND)} · <a href="${APP_URL}" style="color:#71717a;">${escapeHtml(APP_URL.replace(/^https?:\/\//, ""))}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="border-radius:8px;background:${PRIMARY};">
    <a href="${href}" style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

// ── Team invite ────────────────────────────────────────────────

export interface InviteEmailInput {
  companyName?: string;
  inviterName?: string;
  role?: string;
  /** The address the new user signs in with. */
  loginEmail?: string;
  /** Temporary password the admin set — included so the user can sign in. */
  tempPassword?: string;
}

export function buildInviteEmail(input: InviteEmailInput): { subject: string; html: string; text: string } {
  const company = input.companyName?.trim() || "the team";
  const inviter = input.inviterName?.trim();
  const role = input.role?.trim();
  const loginEmail = input.loginEmail?.trim();
  const tempPassword = input.tempPassword?.trim();
  const loginUrl = `${APP_URL}/login`;

  const subject = `You've been invited to join ${company} on ${BRAND}`;
  const intro = inviter
    ? `${escapeHtml(inviter)} has invited you to join <strong>${escapeHtml(company)}</strong> on ${escapeHtml(BRAND)}.`
    : `You've been invited to join <strong>${escapeHtml(company)}</strong> on ${escapeHtml(BRAND)}.`;

  // Credentials block — only when a temporary password was provided.
  const credsHtml =
    loginEmail && tempPassword
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f4f4f5;border-radius:10px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#71717a;">Your login details</p>
            <p style="margin:0 0 6px;font-size:14px;color:#18181b;">Email: <strong>${escapeHtml(loginEmail)}</strong></p>
            <p style="margin:0;font-size:14px;color:#18181b;">Temporary password: <strong style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(tempPassword)}</strong></p>
          </td></tr>
        </table>
        <p style="margin:0 0 4px;color:#71717a;font-size:13px;">For your security, please change this password after your first sign-in.</p>`
      : `<p style="margin:0 0 4px;">Sign in with this email address to get started.</p>`;

  const html = layout(`
    <p style="margin:0 0 12px;">Hi there,</p>
    <p style="margin:0 0 12px;">${intro}${role ? ` Your role: <strong>${escapeHtml(role)}</strong>.` : ""}</p>
    ${credsHtml}
    ${button("Sign in to " + BRAND, loginUrl)}
    <p style="margin:12px 0 0;color:#71717a;font-size:13px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
  `);

  const credsText =
    loginEmail && tempPassword
      ? [
          `Your login details:`,
          `  Email: ${loginEmail}`,
          `  Temporary password: ${tempPassword}`,
          `(For your security, please change this password after your first sign-in.)`,
        ].join("\n")
      : `Sign in with this email address to get started.`;

  const text = [
    `Hi there,`,
    ``,
    inviter
      ? `${inviter} has invited you to join ${company} on ${BRAND}.`
      : `You've been invited to join ${company} on ${BRAND}.`,
    role ? `Your role: ${role}.` : ``,
    ``,
    credsText,
    ``,
    `Sign in here: ${loginUrl}`,
    ``,
    `If you weren't expecting this invitation, you can safely ignore this email.`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return { subject, html, text };
}

// ── Lead outreach ──────────────────────────────────────────────

export interface OutreachEmailInput {
  message: string;
  senderName?: string;
}

/** Wrap a free-text outreach message in the branded shell. */
export function buildOutreachEmail(input: OutreachEmailInput): { html: string; text: string } {
  const bodyHtml = escapeHtml(input.message).replace(/\n/g, "<br>");
  const signature = input.senderName?.trim()
    ? `<p style="margin:20px 0 0;color:#3f3f46;">${escapeHtml(input.senderName)}<br><span style="color:#a1a1aa;font-size:13px;">${escapeHtml(BRAND)}</span></p>`
    : "";

  const html = layout(`<div>${bodyHtml}</div>${signature}`);
  const text = input.senderName?.trim()
    ? `${input.message}\n\n${input.senderName}\n${BRAND}`
    : input.message;

  return { html, text };
}

// ── New-lead notification (internal) ───────────────────────────

export interface NewLeadNotifyInput {
  count: number;
  vertical?: string;
  importedBy?: string;
  leads: { company: string; contactName?: string; estimatedValue?: number }[];
}

export function buildNewLeadNotification(input: NewLeadNotifyInput): { subject: string; html: string; text: string } {
  const n = input.count;
  const leadsUrl = `${APP_URL}/crm/leads`;
  const subject = `${n} new lead${n === 1 ? "" : "s"} imported${input.vertical ? ` · ${input.vertical}` : ""}`;

  const rows = input.leads
    .slice(0, 25)
    .map(
      (l) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">${escapeHtml(l.company)}${l.contactName ? `<br><span style="color:#a1a1aa;font-size:12px;">${escapeHtml(l.contactName)}</span>` : ""}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#3f3f46;text-align:right;">${l.estimatedValue ? "R" + l.estimatedValue.toLocaleString() : "—"}</td>
      </tr>`
    )
    .join("");

  const html = layout(`
    <p style="margin:0 0 12px;"><strong>${n}</strong> new lead${n === 1 ? "" : "s"} ${input.importedBy ? `imported by ${escapeHtml(input.importedBy)} ` : "imported "}into the CRM${input.vertical ? ` (${escapeHtml(input.vertical)})` : ""}.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">${rows}</table>
    ${input.leads.length > 25 ? `<p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">…and ${input.leads.length - 25} more.</p>` : ""}
    ${button("View leads", leadsUrl)}
  `);

  const text = [
    `${n} new lead${n === 1 ? "" : "s"} ${input.importedBy ? `imported by ${input.importedBy}` : "imported"} into the CRM${input.vertical ? ` (${input.vertical})` : ""}.`,
    ``,
    ...input.leads.map(
      (l) => `- ${l.company}${l.contactName ? ` (${l.contactName})` : ""}${l.estimatedValue ? ` — R${l.estimatedValue.toLocaleString()}` : ""}`
    ),
    ``,
    `View leads: ${leadsUrl}`,
  ].join("\n");

  return { subject, html, text };
}

// ── Invoice ────────────────────────────────────────────────────

export interface InvoiceEmailInput {
  invoice: Invoice;
  /** Optional free-text note from the sender (e.g. payment/bank details). */
  message?: string;
  /** Sending company name (defaults to BRAND). */
  companyName?: string;
}

function money(amount: number | undefined, currency: string): string {
  const value = typeof amount === "number" ? amount : 0;
  try {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: currency || "ZAR" }).format(value);
  } catch {
    return `${currency || "ZAR"} ${value.toFixed(2)}`;
  }
}

export function buildInvoiceEmail(input: InvoiceEmailInput): { subject: string; html: string; text: string } {
  const inv = input.invoice;
  const currency = inv.currency || "ZAR";
  const company = input.companyName?.trim() || BRAND;
  const balance = typeof inv.balanceDue === "number" ? inv.balanceDue : inv.total;

  const subject = `Invoice ${inv.invoiceNumber} from ${company} — ${money(inv.total, currency)} due ${inv.dueDate}`;

  const itemRows = (inv.lineItems || [])
    .map((li) => {
      const lineTotal = typeof li.lineTotal === "number" ? li.lineTotal : li.total;
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#18181b;">${escapeHtml(li.description || "")}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#3f3f46;text-align:center;">${li.quantity ?? 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#3f3f46;text-align:right;">${money(li.unitPrice, currency)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#18181b;text-align:right;font-weight:600;">${money(lineTotal, currency)}</td>
      </tr>`;
    })
    .join("");

  const totalsRow = (label: string, value: string, opts?: { strong?: boolean; danger?: boolean }) =>
    `<tr>
      <td style="padding:4px 8px;font-size:13px;text-align:right;color:${opts?.strong ? "#18181b" : "#71717a"};${opts?.strong ? "font-weight:700;" : ""}">${escapeHtml(label)}</td>
      <td style="padding:4px 8px;font-size:13px;text-align:right;width:120px;color:${opts?.danger ? "#dc2626" : opts?.strong ? "#18181b" : "#3f3f46"};${opts?.strong ? "font-weight:700;" : ""}">${value}</td>
    </tr>`;

  const messageBlock = input.message?.trim()
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f4f4f5;border-radius:10px;"><tr><td style="padding:14px 16px;font-size:13px;color:#3f3f46;">${escapeHtml(input.message.trim()).replace(/\n/g, "<br>")}</td></tr></table>`
    : "";

  const html = layout(`
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#18181b;">Invoice ${escapeHtml(inv.invoiceNumber)}</p>
    <p style="margin:0 0 16px;color:#71717a;font-size:13px;">Issued ${escapeHtml(inv.issuedDate)} · Due ${escapeHtml(inv.dueDate)}</p>
    <p style="margin:0 0 12px;">Dear ${escapeHtml(inv.tenantName)},</p>
    <p style="margin:0 0 4px;">Please find your invoice from <strong>${escapeHtml(company)}</strong> below.</p>
    ${messageBlock}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;border-collapse:collapse;">
      <tr>
        <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#a1a1aa;text-align:left;border-bottom:2px solid #e4e4e7;">Description</th>
        <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#a1a1aa;text-align:center;border-bottom:2px solid #e4e4e7;">Qty</th>
        <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#a1a1aa;text-align:right;border-bottom:2px solid #e4e4e7;">Unit</th>
        <th style="padding:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;color:#a1a1aa;text-align:right;border-bottom:2px solid #e4e4e7;">Total</th>
      </tr>
      ${itemRows}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">
      ${totalsRow("Subtotal", money(inv.subtotal, currency))}
      ${inv.discountAmount ? totalsRow("Discount", `- ${money(inv.discountAmount, currency)}`) : ""}
      ${totalsRow(`VAT${inv.taxRate ? ` (${inv.taxRate}%)` : ""}`, money(inv.taxAmount, currency))}
      ${totalsRow("Total", money(inv.total, currency), { strong: true })}
      ${inv.amountPaid ? totalsRow("Amount paid", `- ${money(inv.amountPaid, currency)}`) : ""}
      ${totalsRow("Balance due", money(balance, currency), { strong: true, danger: (balance ?? 0) > 0 })}
    </table>
    ${inv.notes ? `<p style="margin:16px 0 0;color:#71717a;font-size:12px;">${escapeHtml(inv.notes)}</p>` : ""}
    <p style="margin:16px 0 0;color:#71717a;font-size:13px;">Thank you for your business.</p>
  `);

  const text = [
    `Invoice ${inv.invoiceNumber} from ${company}`,
    `Issued ${inv.issuedDate} · Due ${inv.dueDate}`,
    ``,
    `Dear ${inv.tenantName},`,
    ``,
    input.message?.trim() ? `${input.message.trim()}\n` : "",
    ...(inv.lineItems || []).map(
      (li) =>
        `- ${li.description} — ${li.quantity ?? 1} x ${money(li.unitPrice, currency)} = ${money(typeof li.lineTotal === "number" ? li.lineTotal : li.total, currency)}`
    ),
    ``,
    `Subtotal: ${money(inv.subtotal, currency)}`,
    `VAT${inv.taxRate ? ` (${inv.taxRate}%)` : ""}: ${money(inv.taxAmount, currency)}`,
    `Total: ${money(inv.total, currency)}`,
    `Balance due: ${money(balance, currency)}`,
    ``,
    `Thank you for your business.`,
  ]
    .filter((l) => l !== "")
    .join("\n");

  return { subject, html, text };
}
