# Zerpa sales process and pricing

How Zerpa sells itself: who we sell to, the offer, the prices, how a deal becomes a paying customer, and how
we grow and keep accounts. Prices and billing rules come from the code, so check there first if this drifts:

- Plans and prices: `zerpa-api/apps/tenancy/plans.py` (`PLANS`, `ADDONS`, `monthly_charge`)
- Billing (Paystack card and EFT invoices, failed payments): `zerpa-api/apps/hq/subscriptions.py`
- Offers (founding cohorts): `zerpa-api/apps/hq/offers.py`, managed in Zerpa HQ → Offers
- Launch and review playbooks: `zerpa-api/apps/hq/success.py`

Last updated 2026-09-28.

---

## 1. Who we sell to

We launch with **MSPs** (IT support and managed service companies), then **telecoms** (ISPs, fibre and
wireless providers). Other industries can sign up and use Zerpa, but sales and marketing effort goes to these two.

What an MSP buys from us: **every billable hour ends up on an invoice**, and they are **live in 14 days**
without running the migration themselves. Tickets, time, agreements and retainer billing live in one system,
so time logged on a ticket feeds the monthly agreement invoice.

Good fit:
- 3–30 technicians, billing monthly retainers plus hourly work
- Time tracking and invoicing in separate tools today (a PSA plus an accounting package, or spreadsheets)
- The owner feels there is work being done that never gets billed

Poor fit (be honest early):
- Needs a deep RMM or PSA integration on day one (our PSA and Microsoft CSP connectors are not built yet)
- Wants to resell or white-label Zerpa
- Won't log time on tickets (the value, and the 90-day guarantee, depend on it)

---

## 2. Prices

Company packs with users included. Rand, excluding 15% VAT. Portal customers (their clients) are always free.

| Plan (code) | Per month | Users included | Extra user / month | Launch fee (once-off) | What's in it |
|---|---|---|---|---|---|
| Free (`free`) | R 0 | 3 (hard cap) | — | — | 1 app |
| Business (`standard`) | R 1 490 | 5 | R 179 | R 4 500 | All apps except industry apps |
| Industry (`industry`) | R 3 990 | 10 | R 249 | R 8 500 | Business plus 1 industry pack |
| Scale (`scale`) | R 8 990 | 25 | R 199 | R 15 000 | 2 industry packs, up to 3 companies, priority support |

- **Annual:** pay 10 months for 12 (10 × base), and **no launch fee**. Extra users and add-ons are still billed monthly.
- **Add-ons:** extra industry pack R 990 / month, extra company R 990 / month.
- **Trial:** every paid plan starts with a 14-day trial. No card needed to start.
- **The launch fee** pays for the set-up we do with them: importing clients, contracts and open tickets, invoice
  templates and recurring billing. It is not a discount lever; use annual billing instead.

Worked example (Industry, 13 users, monthly): R 3 990 + 3 × R 249 = **R 4 737** a month excl. VAT; first
payment with the launch fee is R 13 237 excl. VAT (R 15 222.55 incl.). The pricing calculator on the website
and Settings → Plan in the app use the same maths.

**Discounts:** none apart from annual billing and founding offers. Don't invent one-off deals; if a
prospect needs something different, raise it with the founder.

---

## 3. The offer: founding MSP cohort

Managed in Zerpa HQ → Offers (`msp-founding`). Seats and status are live on the website.

- **Headline:** Every billable hour invoiced. Live in 14 days.
- **Plan:** Industry, with the price locked for 24 months from the first payment.
- **Cap:** 20 companies; closes 30 November 2026.
- **What's included (launch value R 14 500):**
  - We move your clients, contracts and open tickets in (R 6 000)
  - Invoice templates and retainer billing set up for you (R 3 000)
  - Unbilled Hours Audit at day 30 and day 90 (R 4 000)
  - WhatsApp quote and payment-reminder templates (R 1 500)
- **Guarantee:** Live in 14 days or the launch fee back. If we find less unbilled time than one month's
  subscription in the first 90 days, the next 3 months are free.
- **Conditions** (website `offer-terms.html`): the 14-day clock starts the day we receive their data; the 90-day
  guarantee needs time logged on at least 90% of tickets.

The signup link is `https://app.zerpa.co.za/register?offer=msp-founding`. A seat is only taken when the company
pays; until then they are on a normal trial. When the cohort is full the website switches to "Join the waitlist".

---

## 4. The funnel

### Stage 1: Lead
Sources: the website (demo form, the unbilled-hours calculator at `tools/unbilled-hours.html`), partners
(accountants and IT resellers with a `?ref=` link), and direct outreach to MSPs. Every website form becomes a
lead in Zerpa's own CRM (HQ company). Trials and free companies are scored as product-qualified leads in HQ → Sales.

### Stage 2: Discovery call (15–20 minutes)
- How do they bill today? Retainers, hourly, projects?
- Where is time logged, and how does it get onto invoices?
- Rough numbers: technicians, unbilled hours a week, hourly rate. Run the unbilled-hours calculator with them.
- Team size, so we can point them at the right plan.

### Stage 3: Demo and trial
- Show a ticket with time logged, the agreement with included hours and overage, and the month's agreement invoice.
- Show the customer portal and a WhatsApp payment reminder.
- Start the trial with the offer link. Point out that the founding seat is confirmed by the first payment.

### Stage 4: Close
- In the app, Settings → Plan: pay by card (Paystack) or choose an EFT invoice from Zerpa.
- Card: the first charge is the launch fee (not on annual), the first month or year, and any extra users and add-ons.
- EFT: Zerpa emails a VAT invoice with a Paystack payment link each month.
- Once paid: the plan is active, the offer seat is taken and the price lock starts.

### Stage 5: Launch (14 days)
The success manager sets "Data received on" on the company in HQ → Companies. That starts the clock and
creates the launch tasks:

| Days | Step |
|---|---|
| 0–2 | Import clients, contracts and open tickets |
| 3–5 | Invoice templates and retainer billing |
| 6–8 | Time tracking, SLAs and WhatsApp templates |
| 9–10 | Test run: log time on a real ticket, raise and send the invoice |
| 11–13 | Train the team, fix what the test run found |
| 14 | Go-live sign-off (marking it done stops the clock) |

Launches at day 10 or later that aren't live show in HQ's command centre. If we miss day 14 through our own
fault, the launch fee is refunded.

### Stage 6: Reviews at day 30 and 90
Created with the launch: the Unbilled Hours Audit at day 30 and day 90, and the guarantee check at day 91.
Compare the time logged with what was invoiced and share the rand figure with the owner.

### Stage 7: Grow and keep
- **Extra users** are never blocked on paid plans; they're billed at the plan's extra-user price.
- **Upgrade signals:** HQ → Customer success flags companies with users over the included number. Ask about a second industry or a second company at the day-30 and day-90 reviews.
- **Scale** is for multi-company groups or two industries.
- **Failed payments:** reminder (email and WhatsApp) on day 0, retry and second reminder on day 3, an HQ call
  task on day 7, read-only on day 14 (they can still view and export), suspended on day 30. Data is kept for
  90 days after that. Call on day 7; don't wait for read-only.
- **Cancel or pause** is in the app, with a save offer per reason. Pausing (1–3 months) stops charges.

---

## 5. Partners

Accountants, IT resellers and customers can refer companies with a `?ref=<code>` link (HQ → Partners). The
default commission is 20% of the referred company's monthly plan fee for 12 months, paid monthly by finance.

---

## 6. Numbers to track (HQ → Revenue, Sales and Offers)

Measure these rather than assuming them:
- Trial → paid rate (HQ → Sales, last 90 days)
- Founding seats taken and MRR from each offer
- Launches live by day 14 (and launch fees refunded)
- 30-day cash per new customer (launch fee plus the first month)
- MRR by plan, monthly vs annual, add-ons
- Failed payments and accounts in read-only or suspended
