/**
 * @file lib/server/email/templates.ts
 * @description Server-only HTML/text builders for Zerpa's transactional emails.
 * Kept framework-free (inline styles, tables) for broad email-client support.
 */

const BRAND = process.env.SES_FROM_NAME || process.env.NEXT_PUBLIC_APP_NAME || "Zerpa";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://app.zerpa.co.za").replace(/\/$/, "");
const PRIMARY = "#4f46e5";

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
}

export function buildInviteEmail(input: InviteEmailInput): { subject: string; html: string; text: string } {
  const company = input.companyName?.trim() || "the team";
  const inviter = input.inviterName?.trim();
  const role = input.role?.trim();
  const loginUrl = `${APP_URL}/login`;

  const subject = `You've been invited to join ${company} on ${BRAND}`;
  const intro = inviter
    ? `${escapeHtml(inviter)} has invited you to join <strong>${escapeHtml(company)}</strong> on ${escapeHtml(BRAND)}.`
    : `You've been invited to join <strong>${escapeHtml(company)}</strong> on ${escapeHtml(BRAND)}.`;

  const html = layout(`
    <p style="margin:0 0 12px;">Hi there,</p>
    <p style="margin:0 0 12px;">${intro}${role ? ` Your role: <strong>${escapeHtml(role)}</strong>.` : ""}</p>
    <p style="margin:0 0 4px;">Sign in with this email address to get started.</p>
    ${button("Open " + BRAND, loginUrl)}
    <p style="margin:12px 0 0;color:#71717a;font-size:13px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
  `);

  const text = [
    `Hi there,`,
    ``,
    inviter
      ? `${inviter} has invited you to join ${company} on ${BRAND}.`
      : `You've been invited to join ${company} on ${BRAND}.`,
    role ? `Your role: ${role}.` : ``,
    ``,
    `Sign in with this email address to get started: ${loginUrl}`,
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
