/**
 * @file app/api/email/invoice/route.ts
 * @description Emails an invoice to a customer via Amazon SES. From address is
 * the billing role identity; Reply-To is the sending user so replies reach a
 * real person. Body renders the full invoice (line items + totals) as HTML.
 *
 * POST /api/email/invoice
 *   body: {
 *     to: string, cc?: string, subject?: string, message?: string,
 *     replyTo?: string, companyName?: string, invoice: Invoice
 *   }
 */
import { NextResponse } from "next/server";
import type { Invoice } from "@zerpa/shared-types";
import { sendEmail, EmailConfigError } from "@/lib/server/email/ses";
import { buildInvoiceEmail, formatFrom, BILLING_FROM_EMAIL } from "@/lib/server/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: {
    to?: string;
    cc?: string;
    subject?: string;
    message?: string;
    replyTo?: string;
    companyName?: string;
    invoice?: Invoice;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: NO_STORE });
  }

  const to = body.to?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json(
      { error: "A valid `to` email address is required." },
      { status: 400, headers: NO_STORE }
    );
  }
  if (!body.invoice || !body.invoice.invoiceNumber) {
    return NextResponse.json(
      { error: "An `invoice` object is required." },
      { status: 400, headers: NO_STORE }
    );
  }

  const built = buildInvoiceEmail({
    invoice: body.invoice,
    message: body.message,
    companyName: body.companyName,
  });
  const subject = body.subject?.trim() || built.subject;

  const cc = body.cc?.trim();
  const replyTo = body.replyTo?.trim();
  const from = formatFrom(`${body.companyName?.trim() || "Zerpa"} Billing`, BILLING_FROM_EMAIL);

  try {
    const messageId = await sendEmail({
      to,
      from,
      subject,
      html: built.html,
      text: built.text,
      ...(cc && EMAIL_RE.test(cc) ? { cc } : {}),
      ...(replyTo && EMAIL_RE.test(replyTo) ? { replyTo } : {}),
    });
    return NextResponse.json({ ok: true, messageId }, { headers: NO_STORE });
  } catch (err) {
    const message =
      err instanceof EmailConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to send invoice email.";
    const status = err instanceof EmailConfigError ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status, headers: NO_STORE });
  }
}
