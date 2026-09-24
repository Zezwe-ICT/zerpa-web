/**
 * Company details used on the Terms and Privacy pages. Set these in the environment before publishing;
 * anything missing shows as a clearly marked placeholder rather than a guess.
 */
const env = (value: string | undefined, placeholder: string) => (value && value.trim()) || placeholder;

export const LEGAL = {
  entity: env(process.env.NEXT_PUBLIC_LEGAL_ENTITY, "[Registered company name]"),
  registration: env(process.env.NEXT_PUBLIC_LEGAL_REG_NUMBER, "[CIPC registration number]"),
  address: env(process.env.NEXT_PUBLIC_LEGAL_ADDRESS, "[Registered address]"),
  informationOfficer: env(process.env.NEXT_PUBLIC_INFO_OFFICER, "[Information Officer name]"),
  privacyEmail: env(process.env.NEXT_PUBLIC_PRIVACY_EMAIL, "[privacy email address]"),
  supportEmail: env(process.env.NEXT_PUBLIC_SUPPORT_EMAIL, "[support email address]"),
  /** Set to "approved" once an attorney has reviewed both pages; also bump TERMS_VERSION in the API. */
  approved: process.env.NEXT_PUBLIC_LEGAL_STATUS === "approved",
  lastUpdated: env(process.env.NEXT_PUBLIC_LEGAL_UPDATED, "[date]"),
};
