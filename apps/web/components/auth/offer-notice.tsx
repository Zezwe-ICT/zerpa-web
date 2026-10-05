/**
 * @file components/auth/offer-notice.tsx
 * @description On signup: shows the offer from the link (?offer=code) and whether a spot is still open.
 */
"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { getPublicOffers, type PublicOffer } from "@/lib/api/offers";
import { takeOffer } from "@/components/referral-capture";

export function OfferNotice() {
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("offer")?.toLowerCase() || takeOffer();
    if (!code) return;
    getPublicOffers()
      .then((rows) => setOffer(rows.find((o) => o.code === code) ?? null))
      .catch(() => undefined);
  }, []);
  if (!offer) return null;
  const open = offer.status === "open";
  return (
    <div className={`rounded-[10px] border p-4 text-sm space-y-1 ${open ? "border-primary/30 bg-primary/5" : "border-border bg-surface"}`}>
      <p className="flex items-center gap-2 font-medium">
        <Ticket size={14} className="text-primary" /> {offer.headline}
      </p>
      <p className="text-xs text-muted-fg">
        {open
          ? `You're claiming a founding spot: ${offer.seats_left} of ${offer.seat_cap} left. Your spot is confirmed when your first payment goes through.`
          : "This offer is no longer open, so you'll join on our normal plans. You still get a 14-day free trial."}
      </p>
    </div>
  );
}
