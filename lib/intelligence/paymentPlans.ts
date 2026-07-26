// Static payment-plan tiers per project. There is no live source for payment-plan
// terms anywhere in the scraped feed — unlike price/possession/etc, these are
// business terms that only ever exist as static, hand-authored config, keyed by
// project slug. Every project always gets a result via DEFAULT_PLANS.

export type PaymentPlanTier = {
  id: string;
  name: string;
  tag?: string;
  splitLabel: string;
  upfrontPct: number;
  description: string;
};

const DEFAULT_PLANS: PaymentPlanTier[] = [
  {
    id: "clp",
    name: "Construction-Linked Plan",
    tag: "Most Popular",
    splitLabel: "10 : 80 : 10",
    upfrontPct: 10,
    description: "Pay in stages tied to construction milestones — a lower upfront burden.",
  },
  {
    id: "down-payment",
    name: "Down Payment Plan",
    tag: "Best Price",
    splitLabel: "95 : 5",
    upfrontPct: 95,
    description: "Pay upfront and unlock the maximum price advantage from the developer.",
  },
  {
    id: "possession-linked",
    name: "Possession-Linked Plan",
    tag: "Flexible",
    splitLabel: "20 : 80",
    upfrontPct: 20,
    description: "Minimal upfront, majority near possession — ideal for end-users.",
  },
];

const PROJECT_PAYMENT_PLANS: Record<string, PaymentPlanTier[]> = {
  "m3m-route-65": [
    {
      id: "clp",
      name: "Construction-Linked Plan",
      tag: "Most Popular",
      splitLabel: "10 : 80 : 10",
      upfrontPct: 10,
      description: "Pay in stages tied to construction milestones — a lower upfront burden.",
    },
    {
      id: "down-payment",
      name: "Down Payment Plan",
      tag: "Best Price",
      splitLabel: "95 : 5",
      upfrontPct: 95,
      description: "Pay upfront and unlock the maximum price advantage and assured returns.",
    },
    {
      id: "possession-linked",
      name: "Possession-Linked Plan",
      tag: "Flexible",
      splitLabel: "20 : 80",
      upfrontPct: 20,
      description: "Minimal upfront, majority near possession — ideal for end-users.",
    },
  ],
};

export function getPaymentPlans(slug: string): PaymentPlanTier[] {
  return PROJECT_PAYMENT_PLANS[slug] || DEFAULT_PLANS;
}
