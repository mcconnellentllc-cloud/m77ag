// Business entity definitions — the core organizational structure
// Every email, bill, and expense gets tagged to one of these

export interface EntityDefinition {
  slug: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  expenseCategories: string[];
}

export const ENTITIES: EntityDefinition[] = [
  {
    slug: "m77ag",
    name: "M77 AG",
    color: "#16a34a",
    icon: "Tractor",
    description: "Farm & ranch, custom farming",
    expenseCategories: [
      "seed", "chemical", "fertilizer", "fuel", "equipment repairs",
      "equipment purchase", "rent/lease", "labor", "insurance", "utilities",
      "trucking", "custom hire", "crop insurance", "irrigation", "office", "other",
    ],
  },
  {
    slug: "cattle",
    name: "McConnell Cattle",
    color: "#92400e",
    icon: "Beef",
    description: "Cattle operations",
    expenseCategories: [
      "feed", "mineral", "vet", "hauling", "processing", "pasture rent",
      "fencing", "equipment", "insurance", "other",
    ],
  },
  {
    slug: "pioneer",
    name: "Pioneer Seeds",
    color: "#f59e0b",
    icon: "Wheat",
    description: "Pioneer/Corteva seed sales",
    expenseCategories: [
      "marketing", "travel", "customer events", "supplies", "other",
    ],
  },
  {
    slug: "togoag",
    name: "ToGoAG",
    color: "#ec4899",
    icon: "Store",
    description: "Retail business",
    expenseCategories: [
      "inventory", "shipping", "licensing", "insurance", "supplies",
      "marketing", "other",
    ],
  },
  {
    slug: "acreprofit",
    name: "AcreProfit",
    color: "#8b5cf6",
    icon: "FlaskConical",
    description: "Chemical sales",
    expenseCategories: [
      "chemical inventory", "shipping", "licensing", "insurance", "supplies",
      "marketing", "other",
    ],
  },
  {
    slug: "cocorn",
    name: "Colorado Corn / CCGA",
    color: "#eab308",
    icon: "Sprout",
    description: "Board & association work",
    expenseCategories: [
      "travel", "events", "meetings", "association dues", "other",
    ],
  },
  {
    slug: "hunting",
    name: "Hunting",
    color: "#78716c",
    icon: "Target",
    description: "Commercial hunting operations",
    expenseCategories: [
      "lease costs", "improvements", "insurance", "equipment", "marketing", "other",
    ],
  },
  {
    slug: "mcconnellent",
    name: "McConnell Enterprises",
    color: "#3b82f6",
    icon: "Building2",
    description: "Holding company, bills",
    expenseCategories: [
      "utilities", "insurance", "accounting", "legal", "office", "other",
    ],
  },
  {
    slug: "personal",
    name: "Personal / Family",
    color: "#06b6d4",
    icon: "Users",
    description: "Kyle & Brandi personal",
    expenseCategories: [
      "groceries", "utilities", "mortgage", "vehicles", "medical",
      "kids activities", "other",
    ],
  },
  {
    slug: "flamesoffury",
    name: "Flames of Fury",
    color: "#ef4444",
    icon: "Flame",
    description: "Book project",
    expenseCategories: [
      "writing", "publishing", "marketing", "travel", "other",
    ],
  },
];

export function getEntityBySlug(slug: string): EntityDefinition | undefined {
  return ENTITIES.find((e) => e.slug === slug);
}

export function getEntityColor(slug: string): string {
  return getEntityBySlug(slug)?.color ?? "#6b7280";
}
