export type PlanId =
  | "community_monthly"
  | "pro_monthly"
  | "pro_yearly"
  | "business_monthly"
  | "business_yearly";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  slices: number;
  /** Higher = bigger plan. Used to decide upgrade vs. downgrade. */
  tier: number;
  features: string[];
  cta: string;
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "community_monthly",
    name: "Community · $4",
    price: "$4",
    period: "/month",
    slices: 50,
    tier: 1,
    features: [
      "50 slices per month",
      "HD downloads",
      "All slices unlocked",
      "Trust-based — no proof needed",
    ],
    cta: "Join Community",
  },
  {
    id: "pro_monthly",
    name: "Pro monthly",
    price: "$12",
    period: "/month",
    slices: 90,
    tier: 2,
    features: ["90 slices per month", "HD downloads", "All slices unlocked", "Cancel anytime"],
    cta: "Go Pro monthly",
  },
  {
    id: "pro_yearly",
    name: "Pro yearly",
    price: "$110",
    period: "/year",
    slices: 90,
    tier: 3,
    features: [
      "90 slices per month (1,080/year)",
      "HD downloads",
      "Save $34 vs monthly",
      "Cancel anytime",
    ],
    cta: "Go Pro yearly",
    highlight: true,
  },
  {
    id: "business_monthly",
    name: "Business",
    price: "$29",
    period: "/month",
    slices: 250,
    tier: 4,
    features: [
      "250 slices per month",
      "HD downloads",
      "Priority generation queue",
      "Commercial use for client work",
    ],
    cta: "Go Business",
  },
  {
    id: "business_yearly",
    name: "Business yearly",
    price: "$290",
    period: "/year",
    slices: 250,
    tier: 5,
    features: [
      "250 slices per month (3,000/year)",
      "HD downloads",
      "Priority generation queue",
      "Save $58 vs monthly",
    ],
    cta: "Go Business yearly",
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

/** The next sensible step up from the given plan, if any. */
export function nextUpgrade(id: string | null | undefined): Plan | undefined {
  const current = getPlan(id);
  if (!current) return undefined;
  if (current.id === "community_monthly") return getPlan("pro_monthly");
  if (current.id === "pro_monthly" || current.id === "pro_yearly")
    return getPlan("business_monthly");
  return undefined;
}
