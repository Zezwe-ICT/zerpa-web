/**
 * @file app/(public)/terms/page.tsx
 * @description Terms of Use. DRAFT until reviewed by a South African attorney; see lib/legal.ts.
 */
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Terms of Use · Zerpa" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>
        These terms are an agreement between you and {LEGAL.entity} (&ldquo;Zerpa&rdquo;, &ldquo;we&rdquo;) for using
        Zerpa, a service for running a business: customers, quotes, invoices, payments and related tools. By creating an
        account or joining a business on Zerpa, you agree to them.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details and keep your password safe. We recommend turning on two-step sign-in.</li>
        <li>You&apos;re responsible for what happens under your login. Tell us straight away if you think someone else has used it.</li>
        <li>If you sign up on behalf of a business, you confirm you&apos;re authorised to do so.</li>
      </ul>

      <h2>Your business&apos;s data</h2>
      <ul>
        <li>Your records belong to your business. You can export them from Settings → Data &amp; Exports.</li>
        <li>
          When you keep information about your own customers in Zerpa, your business is responsible for it under POPIA,
          including having a lawful reason to hold it and answering your customers&apos; requests. Zerpa provides tools
          for this (export and erase a customer&apos;s details). See our <Link href="/privacy" className="underline">Privacy Notice</Link>.
        </li>
        <li>You&apos;re responsible for the accuracy of quotes, invoices and tax information you issue, including VAT.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>Don&apos;t use Zerpa to send spam, break the law, or mislead or defraud anyone.</li>
        <li>Don&apos;t try to access other businesses&apos; data or interfere with the service.</li>
        <li>WhatsApp and email you send through Zerpa must follow the rules of those services and South African law.</li>
      </ul>

      <h2>Payments you collect</h2>
      <p>
        Online payments are processed by the payment providers you connect (for example PayFast or Ozow) under your own
        agreement with them. Money goes to your account with that provider. Zerpa records the result but does not hold
        your customers&apos; money.
      </p>

      <h2>Plans and fees</h2>
      <p>
        Zerpa&apos;s plans and prices are shown in Settings → Plan. Paid plans start with a free trial. We&apos;ll tell
        you before any charge and before prices change. Portal access for your customers is free.
      </p>

      <h2>Availability and changes</h2>
      <p>
        We work to keep Zerpa available and your data backed up, but can&apos;t promise it will never be interrupted. We may
        improve or change features; we&apos;ll give notice of changes that materially affect you.
      </p>

      <h2>Ending the agreement</h2>
      <p>
        You can stop using Zerpa at any time and export your data first. We may suspend accounts that break these terms or
        leave fees unpaid, after giving notice where reasonable.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, Zerpa isn&apos;t liable for indirect losses, and our total liability is limited to the
        fees you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under the
        Consumer Protection Act where it applies.
      </p>

      <h2>Law and contact</h2>
      <p>
        South African law applies. Questions: {LEGAL.supportEmail}. {LEGAL.entity}, {LEGAL.address}.
      </p>
    </LegalPage>
  );
}
