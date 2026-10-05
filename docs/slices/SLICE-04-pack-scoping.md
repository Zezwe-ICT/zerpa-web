# SLICE-04 — Pack selection, setup and vertical-scoped surfaces

**Goal:** a tenant sees only their own vertical. Their nav, dashboard, labels and record types come from their company's pack, resolved server-side. No tenant sees another tenant's data, and no tenant sees another vertical's product.

**Depends on:** SLICE-03 (manifest schema formalised). Do not start before it.

**Two distinct guarantees — both required:**
- **Isolation (security):** company A's rows are unreachable from company B. Failure = POPIA breach.
- **Scoping (product):** a SPA company sees spa nav and a spa dashboard, never MSP's. Failure = the product looks wrong for the tenant.

## Assumptions to confirm before coding

1. What resolves nav today in `apps/web`? If it is a static config with pack conditionals, **this slice replaces it**. Report what you found before changing it.
2. Where does the session currently carry company context? Reuse it; do not add a second mechanism.
3. Does Nest already create companies? This slice extends that flow rather than building a parallel signup.

## 1. Pack is a property of the company

- `Company.pack_id` + `Company.pack_version` (pinned). Not on the user, not in the session payload, not in localStorage.
- Login with one membership → straight into that company. Several memberships → **company picker** (not a vertical picker). Switching company re-resolves the manifest.
- **The client never sends a pack identifier.** The server derives it from the authenticated membership's company. Treat a client-supplied pack id as it would a client-supplied `tenantId`: ignore it.

## 2. Nest: pack selection and setup

- Vertical chosen once at company creation, with plain-language scope on each card including **what the pack does not do** (funeral: arrangements, not policies; restaurant: guest CRM, not a till).
- `GENERIC` while setup is incomplete, so a half-configured company is never in a broken vertical state.
- Manifest-declared `setupSteps` drive a checklist: required Regulatory Profile fields, required ports, resource types, catalogue seed, roles.
- **Go-live gate:** company is not live until required steps pass. Demo seed data visibly marked as demo until then.
- Pack freely changeable while in `GENERIC` with no real data. Once live, see §5 below.

## 3. Server-resolved navigation

- New endpoint returning **this company's resolved nav tree**: sections the pack declares, filtered by the membership's role permissions. Two filters, both server-side.
- The client renders what it is given. **It must not hold a nav config for all packs with conditionals** — that ships every vertical's screen names to every tenant and drifts silently.
- Labels (work item names, party names, offering names) resolve from the manifest in the same response. A spa has bookings; an MSP has tickets; the kernel object is the same.
- Never emit a nav entry for an unimplemented screen (existing invariant 7).

## 4. Dashboard

- Manifest declares `dashboardWidgets`: widget id, order, required permission.
- Implement the widget registry plus the per-pack sets from `docs/PLATFORM_ARCHITECTURE_SA.md` §6A.3 — **only for widgets whose underlying feature actually exists**. For MSP and TELECOM that is most of them; for the four thin packs it may be none, and an honest empty state beats a fake chart.
- **Every widget query is company-scoped at the query itself**, never filtered in the component. Aggregates are the easiest place in the product to leak another tenant, because a count or a total feels anonymous and skips the scoping a detail view gets.
- A widget the pack does not declare is never rendered.

## 5. Pack change after go-live

- Platform-admin action only, with an audit record of who, when and why. **No dropdown in company settings**, now or later.
- Blocked where work items, agreements or invoices exist under the current pack's record types, with a clear explanation rather than a silent failure.

## Tests (required)

- **Isolation:** user in company A cannot read company B's rows by id, via an empty filter, or via any dashboard widget query. One test per widget.
- **Scoping:** a SPA company's nav response contains no MSP sections; an MSP company's contains no spa sections.
- **Client trust:** a request carrying a forged pack identifier is ignored; the server-derived pack wins.
- **Bundle check:** the frontend bundle does not contain the full cross-pack nav config.
- **Switching:** a user in two companies with different packs gets correctly re-resolved nav, labels and dashboard on switch, with no bleed from the previous company.
- **Go-live gate:** a company missing a required setup step cannot transition to live.
- **Pack change:** blocked once real data exists; audited when performed by platform admin.

## Definition of done

Standard DoD from `.cursor/rules/zerpa-invariants.mdc`. All six pack manifests must still load (SLICE-03). Report any widget you declared but could not back with a real query — and leave it undeclared rather than stubbed.
