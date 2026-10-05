# Zerpa — Design Partner Plan

**Status:** draft v0.1, 2026-09-15
**Companion to:** `docs/PLATFORM_ARCHITECTURE_SA.md`

## Why this is the highest-priority item

Every decision in the architecture document is reasoned from public facts and none of it has been tested against an operator who will pay. `docs/gates/BETA_ACCEPTANCE.md` already requires two MSPs through ticket → resolution → invoice with portal isolation, and one ISP plus one reseller through order → RICA → activate → collect → dunning. Until those exist, the build sequence is a well-sourced guess.

This is not a build task and it will not get done by an agent.

---

## 1. Where the recruitable pools actually are

### TELECOM — the strongest pool, because it is a published list
- **ISPA** (Internet Service Providers' Association) is a recognised industry representative body under the ECT Act, formed 1996, with **roughly 230 members** (the site has reported 220–236 across pages) spanning large, medium and small providers. It **publishes a complete member list**, categorised Large / Medium / Small by infrastructure footprint.
- **Target the Small category**: ISPA defines Small as anyone who is not a national-footprint or internationally-connected operator. That is the segment running on spreadsheets, and the segment Zerpa's Telecom loop was designed for.
- Every ISPA member signs a membership undertaking committing to POPIA compliance — meaning they have already been made to think about the obligations the Compliance Spine addresses. That is a warm opening, not a cold pitch.
- **Events:** iWeek / ZANOG is the annual gathering (ZANOG@iWeek2026 ran recently). ISPA also publishes an FNO Perception Survey — useful context for a coverage/provisioning conversation.

### MSP — no equivalent public register
- No SA MSP association publishes a member list the way ISPA does. Market sizing sources are unhelpful at this granularity (one puts SA at roughly 1% of global MSP market share; another cites ~45,000 SA managed service contracts — neither gives you names).
- **The realistic route is the existing network.** Zezwe ICT operates as an MSP with clients (Gradesmatch, Enke). Allocentra has subscribers. Peer MSPs, vendor distributor channels and M365 CSP networks are where the names are.
- The strongest MSP design partner is one **without a PSA** — email and WhatsApp today — because that is the tenant the MSP loop actually serves, and it makes §2.7's Lite-desk-as-fallback question concrete rather than theoretical.

### AUTOMOTIVE — an accreditation body with a verification tool
- **RMI** and its workshop association **MIWA** accredit around 2,600 workshops nationally, with a public search tool for verifying accreditation. Accreditation covers administration systems explicitly, alongside premises, tools, OHS and staffing.
- Many insurers will not place a non-accredited workshop on a preferred supplier list — so accredited workshops are, by definition, the ones doing panel work and carrying the approval workflows the CPA s15 chain models.

### FUNERAL — large, fragmented, mostly unregistered
- Industry representation exists (NFDA, SAFPA) but the sector is heavily fragmented; industry figures cited in the PA/FSCA review describe on the order of 75,000 funeral businesses, most unregistered.
- **Screen hard on the FSCA boundary.** A parlour that collects premiums against a promised death benefit is doing insurance (§1 finding 6) and is the wrong partner — not because they are non-compliant, but because Zerpa cannot serve that part of their business at all. Find one whose insurance side is separately handled by a licensed insurer.

### SPA / RESTAURANT — defer
No structural advantage in recruiting these before the resource kernel and CPA engine exist. Revisit after the funeral pack.

---

## 2. What a design partner arrangement must include

Beyond the commercial terms, two things are non-negotiable because of the architecture:

1. **An operator agreement.** POPIA s21 requires a written contract obliging Zerpa, as operator, to maintain s19 security measures and to notify the tenant immediately on reasonable grounds to believe personal information was accessed by an unauthorised person. The tenant remains accountable for its operator's failures, so a serious telecom or funeral partner will ask. Not having one ready is a deal-stopper. Needs a lawyer.
2. **Support access terms** (§5.10) — what Zerpa staff may see, under what authorisation, and what the tenant can audit themselves.

Then the ordinary design-partner terms: what they get (direct influence, early pricing), what Zerpa gets (real data, weekly access, permission to be named), how long the arrangement runs, and what happens at the end.

---

## 3. What to ask before writing more code

The architecture has open questions that only an operator can settle. Bring these to the first conversations:

- **Do they want Zerpa to own their books?** (§2.2 — pipeline evidence overrides the ops-first ledger decision.)
- **What do they already run**, and which of those would they refuse to leave? That is the `SystemOfRecord` registry, populated from reality rather than assumption (§2.6).
- **MSP: do they have a PSA at all?** Settles §2.7.
- **Telecom: which FNOs, which RADIUS setup, which debit order provider**, and are they collecting by DebiCheck today? A partner with live debit-order collections moves the Mandate Vault to the front of the build sequence (§10 item 7).
- **What would they pay, and for what unit** — seat, company, usage? (§2.8.)
- **Do they do multiple verticals** — an MSP also reselling fibre and VoIP? Settles the multi-pack question (§6, open question 1).

---

## 4. Sequencing note

SLICE-00 (honesty pass) can run in parallel with partner recruitment — it needs no customer. Everything after it benefits from having one. Do not treat "finish the honesty pass" as a reason to delay the first conversation.
