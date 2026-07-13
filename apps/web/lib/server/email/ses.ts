/**
 * @file lib/server/email/ses.ts
 * @description Amazon SES email sender over SMTP (Nodemailer). Server-only.
 * Wraps a cached Nodemailer transport behind a single `sendEmail()` helper so
 * callers (auth, CRM, lead finder) don't touch the transport directly.
 *
 * Required env vars (all server-side — NO NEXT_PUBLIC prefix):
 *   SES_SMTP_HOST   e.g. "email-smtp.eu-north-1.amazonaws.com"
 *   SES_SMTP_PORT   e.g. "587" (STARTTLS) or "465" (TLS)
 *   SES_SMTP_USER   the SES SMTP username (an IAM-derived credential)
 *   SES_SMTP_PASS   the SES SMTP password
 *   SES_FROM_EMAIL  a verified sender, e.g. "no-reply@zerpa.co.za"
 * Optional:
 *   SES_FROM_NAME   display name, e.g. "Zerpa"
 *
 * SMTP credentials must never reach the browser — this module is server-only
 * and is imported exclusively from route handlers / server code.
 */
import nodemailer, { type Transporter } from "nodemailer";

export class EmailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigError";
  }
}

export interface SendEmailParams {
  /** One or more recipient addresses. */
  to: string | string[];
  subject: string;
  /** HTML body. At least one of html/text is required. */
  html?: string;
  /** Plain-text body (fallback for clients without HTML). */
  text?: string;
  /** Optional Reply-To addresses. */
  replyTo?: string | string[];
  /** Optional CC addresses. */
  cc?: string | string[];
  /** Override the default sender. Must be a verified SES identity. */
  from?: string;
}

let cachedTransport: Transporter | null = null;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new EmailConfigError(
      `${name} is not set. Configure the SES SMTP settings in your environment.`
    );
  }
  return value;
}

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const host = requireEnv("SES_SMTP_HOST");
  const port = Number(requireEnv("SES_SMTP_PORT"));
  if (!Number.isFinite(port) || port <= 0) {
    throw new EmailConfigError("SES_SMTP_PORT must be a valid port number (e.g. 587).");
  }
  const user = requireEnv("SES_SMTP_USER");
  const pass = requireEnv("SES_SMTP_PASS");

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    // 465 = implicit TLS; 587/2587 = STARTTLS upgrade.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

/** Build the RFC 5322 From header, optionally with a display name. */
function resolveFrom(override?: string): string {
  const explicit = override?.trim();
  if (explicit) return explicit;

  const email = (process.env.SES_FROM_EMAIL ?? process.env.SES_FROM_ADDRESS)?.trim();
  if (!email) {
    throw new EmailConfigError(
      "SES_FROM_EMAIL is not set. Configure a verified sender address."
    );
  }
  const name = (process.env.SES_FROM_NAME ?? process.env.NEXT_PUBLIC_APP_NAME)?.trim();
  return name ? `"${name.replace(/"/g, "")}" <${email}>` : email;
}

function toList(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Send an email through Amazon SES (via SMTP). Returns the SES MessageId on
 * success. Throws EmailConfigError for missing configuration, or the underlying
 * SMTP error (e.g. rejection when the sender/recipient isn't verified in the
 * SES sandbox) for send failures.
 */
export async function sendEmail(params: SendEmailParams): Promise<string> {
  if (!params.html && !params.text) {
    throw new EmailConfigError("An email needs at least one of `html` or `text`.");
  }
  const from = resolveFrom(params.from);

  const info = await getTransport().sendMail({
    from,
    to: toList(params.to),
    subject: params.subject,
    ...(params.html ? { html: params.html } : {}),
    ...(params.text ? { text: params.text } : {}),
    ...(params.cc ? { cc: toList(params.cc) } : {}),
    ...(params.replyTo ? { replyTo: toList(params.replyTo) } : {}),
  });

  return info.messageId ?? "";
}
