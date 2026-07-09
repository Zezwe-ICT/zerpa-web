/**
 * @file app/api/email/invite/route.ts
 * @description Sends a team-member invitation email via Amazon SES.
 * Called (best-effort) after a member is added to a company.
 *
 * POST /api/email/invite
 *   body: { to: string, companyName?: string, inviterName?: string, role?: string }
 */
import { NextResponse } from "next/server";
import { sendEmail, EmailConfigError } from "@/lib/server/email/ses";
import { buildInviteEmail } from "@/lib/server/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: {
    to?: string;
    companyName?: string;
    inviterName?: string;
    role?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400, headers: NO_STORE }
    );
  }

  const to = body.to?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json(
      { error: "A valid `to` email address is required." },
      { status: 400, headers: NO_STORE }
    );
  }

  const { subject, html, text } = buildInviteEmail({
    companyName: body.companyName,
    inviterName: body.inviterName,
    role: body.role,
  });

  try {
    const messageId = await sendEmail({ to, subject, html, text });
    return NextResponse.json({ ok: true, messageId }, { headers: NO_STORE });
  } catch (err) {
    const message =
      err instanceof EmailConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to send invitation email.";
    const status = err instanceof EmailConfigError ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status, headers: NO_STORE });
  }
}
