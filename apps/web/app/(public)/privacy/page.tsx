/**
 * @file app/(public)/privacy/page.tsx
 * @description Privacy Notice (POPIA). DRAFT until reviewed by a South African attorney; see lib/legal.ts.
 */
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Privacy Notice · Zerpa" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice">
      <p>
        This notice explains how {LEGAL.entity} (registration {LEGAL.registration}, &ldquo;Zerpa&rdquo;, &ldquo;we&rdquo;)
        handles personal information, as required by the Protection of Personal Information Act, 2013 (POPIA).
      </p>

      <h2>Two roles</h2>
      <ul>
        <li>
          <strong>Your own account.</strong> For the people who sign up and use Zerpa, we are the{" "}
          <em>responsible party</em>: we decide how your login and account details are used.
        </li>
        <li>
          <strong>Your business&apos;s customers.</strong> When a business uses Zerpa to keep records about its own
          customers (for example quotes, invoices and contact details), that business is the responsible party and Zerpa
          is its <em>operator</em>. We process that information only on the business&apos;s instructions and to run the
          service. Customers of a business should contact that business first about their information.
        </li>
      </ul>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email address, mobile number, password (stored only as a secure hash), and whether two-step sign-in is on.</li>
        <li>Business details you enter: trading and legal name, VAT and CIPC numbers, address, bank details for invoices.</li>
        <li>Records you create in Zerpa: customers, quotes, invoices, payments, messages and similar.</li>
        <li>Usage and security records: sign-in times, the network address used, and actions taken, so we can keep accounts secure.</li>
        <li>Consent records: when you accepted these terms and this notice, and whether you asked for product updates.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To provide Zerpa: sign-in, storing your records, sending the emails and messages you ask us to send.</li>
        <li>To keep accounts and data secure and to prevent fraud and abuse.</li>
        <li>To bill for Zerpa and meet our legal and tax obligations.</li>
        <li>To send product updates, only if you opted in. You can opt out at any time.</li>
      </ul>
      <p>
        We rely on performing our agreement with you, our legitimate interests in running a secure service, legal
        obligations, and, for marketing, your consent.
      </p>

      <h2>Who we share it with</h2>
      <p>We don&apos;t sell personal information. We share it only with service providers that help run Zerpa:</p>
      <ul>
        <li>Hosting and email: Amazon Web Services (including Amazon SES for email).</li>
        <li>Payments, when a business switches them on: PayFast, Ozow and, for debit orders, Netcash.</li>
        <li>WhatsApp messages, when a business connects it: Meta (WhatsApp Business Platform).</li>
        <li>Error monitoring, set up so that it does not receive personal details.</li>
        <li>Authorities, where the law requires it.</li>
      </ul>
      <p>
        Some of these providers may store or process information outside South Africa. Where they do, we use providers
        bound by agreements that give protection comparable to POPIA, as section 72 requires.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep account information while your account is open. Businesses must keep tax records, such as invoices,
        for at least five years, so those records remain with the business even if a customer asks for their contact
        details to be removed. Security records are kept for a limited period.
      </p>

      <h2>How we protect it</h2>
      <ul>
        <li>Encrypted connections (HTTPS) and encryption of stored secrets and bank account numbers.</li>
        <li>Optional two-step sign-in, rate limits on sign-in, and signing out other devices when a password changes.</li>
        <li>Each business can only see its own records, and people see only what their role allows.</li>
      </ul>

      <h2>Your rights</h2>
      <p>You may ask to see, correct or delete your personal information, or object to how it&apos;s used. In Zerpa:</p>
      <ul>
        <li><strong>Settings → Your account → Download my data</strong> gives you a copy of your account information.</li>
        <li><strong>Settings → Your account → Delete my account</strong> closes your login and removes your personal details.</li>
      </ul>
      <p>
        For anything else, contact our Information Officer, {LEGAL.informationOfficer}, at {LEGAL.privacyEmail}. If you
        are unhappy with our answer, you may complain to the Information Regulator (South Africa):
        inforeg.org.za.
      </p>

      <h2>Contact</h2>
      <p>
        {LEGAL.entity}, {LEGAL.address}. Privacy questions: {LEGAL.privacyEmail}.
      </p>
    </LegalPage>
  );
}
