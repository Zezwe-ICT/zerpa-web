/**
 * @file app/api/email/test/route.ts
 * @description Test-send endpoint to verify Amazon SES is wired up correctly.
 * Runs in Node (keeps AWS credentials server-side). Remove or lock this down
 * once real email flows (auth, billing, CRM) are in place.
 *
 * POST /api/email/test   body: { "to": "you@example.com" }
 */
import { NextResponse } from "next/server";
import { sendEmail, EmailConfigError } from "@/lib/server/email/ses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function POST(request: Request) {
  let to: string | undefined;
  try {
    const body = (await request.json()) as { to?: string };
    to = body.to?.trim();
  } catch {
    // fall through to validation below
  }

  if (!to) {
    return NextResponse.json(
      { error: "A `to` email address is required." },
      { status: 400, headers: NO_STORE }
    );
  }

  try {
    const messageId = await sendEmail({
      to,
      subject: "ZERPA SES test email",
      text: "This is a test email sent from ZERPA via Amazon SES. If you received it, SES is configured correctly.",
      html: "<p>This is a test email sent from <strong>ZERPA</strong> via Amazon SES.</p><p>If you received it, SES is configured correctly. ✅</p>",
    });
    return NextResponse.json({ ok: true, messageId }, { headers: NO_STORE });
  } catch (err) {
    const message =
      err instanceof EmailConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to send email.";
    const status = err instanceof EmailConfigError ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status, headers: NO_STORE });
  }
}
