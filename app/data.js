// HomeBudget — data layer.
// All figures are the Alvarez household's own demo data for November 2026,
// stored in localStorage under "homebudget-v1" so edits persist between
// visits. Nothing is fetched from the network.

export const CATEGORIES = [
  { id: "housing", name: "Housing", color: "#2563eb" },
  { id: "groceries", name: "Groceries", color: "#16a34a" },
  { id: "utilities", name: "Utilities", color: "#0891b2" },
  { id: "transport", name: "Transport", color: "#9333ea" },
  { id: "dining", name: "Dining out", color: "#ea580c" },
  { id: "entertainment", name: "Entertainment", color: "#db2777" },
  { id: "health", name: "Health", color: "#dc2626" },
  { id: "kids", name: "Kids", color: "#ca8a04" },
  { id: "shopping", name: "Shopping", color: "#4f46e5" },
  { id: "other", name: "Other", color: "#64748b" },
];

export const MONTH = "November 2026";

// Monthly totals for June–October 2026, so the Reports page can draw a
// six-month trend. These are the household's own past totals.
export const HISTORY = [
  { month: "Jun 2026", income: 5310, expenses: 2988 },
  { month: "Jul 2026", income: 5470, expenses: 3312 },
  { month: "Aug 2026", income: 5295, expenses: 3150 },
  { month: "Sep 2026", income: 5480, expenses: 3420 },
  { month: "Oct 2026", income: 5465, expenses: 3295 },
];

export const SEED_BUDGETS = {
  housing: 1450,
  groceries: 650,
  utilities: 400,
  transport: 380,
  dining: 250,
  entertainment: 120,
  health: 250,
  kids: 220,
  shopping: 200,
  other: 100,
};

export const SEED_GOALS = [
  { id: "g1", name: "Emergency fund", target: 5000, saved: 3100, note: "3 months of essentials" },
  { id: "g2", name: "Summer vacation", target: 1800, saved: 810, note: "Beach trip in July" },
  { id: "g3", name: "New car down payment", target: 6000, saved: 1250, note: "Replace the 2012 sedan" },
];

// [id, date, type, category, amount, payee, note]
const SEED_ROWS = [
  [1, "2026-11-01", "expense", "housing", 1450.0, "Maple Court Apartments", "Monthly rent"],
  [2, "2026-11-02", "expense", "groceries", 182.4, "FreshMart", "Weekly shop"],
  [3, "2026-11-03", "expense", "transport", 45.0, "Shell", "Gas"],
  [4, "2026-11-03", "expense", "dining", 28.5, "Taco truck", "Lunch with coworkers"],
  [5, "2026-11-04", "expense", "utilities", 79.0, "City Internet", "Internet bill"],
  [6, "2026-11-05", "expense", "kids", 120.0, "Lincoln Elementary", "School lunches, November"],
  [7, "2026-11-06", "expense", "groceries", 96.3, "FreshMart", "Weekly shop"],
  [8, "2026-11-07", "expense", "entertainment", 15.99, "StreamFlix", "Monthly subscription"],
  [9, "2026-11-08", "income", "other", 620.0, "Design client", "Freelance logo work"],
  [10, "2026-11-08", "expense", "dining", 46.2, "Mama Rosa's", "Family dinner"],
  [11, "2026-11-09", "expense", "transport", 98.0, "Metro Transit", "Monthly bus pass"],
  [12, "2026-11-10", "expense", "utilities", 128.4, "City Power", "Electricity bill"],
  [13, "2026-11-11", "expense", "health", 23.75, "CVS Pharmacy", "Prescription refill"],
  [14, "2026-11-12", "expense", "groceries", 74.1, "FreshMart", "Weekly shop"],
  [15, "2026-11-13", "expense", "shopping", 74.0, "Target", "Winter jackets for kids"],
  [16, "2026-11-14", "expense", "transport", 38.5, "Shell", "Gas"],
  [17, "2026-11-15", "income", "other", 4850.0, "Alvarez employer", "November salary"],
  [18, "2026-11-15", "expense", "dining", 19.8, "Corner Bakery", "Breakfast"],
  [19, "2026-11-16", "expense", "utilities", 112.0, "Mobile Carrier", "Two phone lines"],
  [20, "2026-11-17", "expense", "groceries", 132.9, "FreshMart", "Weekly shop"],
  [21, "2026-11-18", "expense", "health", 180.0, "Bright Smile Dental", "Checkup and cleaning"],
  [22, "2026-11-19", "expense", "kids", 85.0, "Youth Soccer League", "Winter season fee"],
  [23, "2026-11-20", "expense", "transport", 142.0, "SafeDrive Insurance", "Car insurance, monthly"],
  [24, "2026-11-21", "expense", "groceries", 58.6, "FreshMart", "Top-up shop"],
  [25, "2026-11-21", "expense", "entertainment", 34.0, "Cineplex", "Movie night, family of four"],
  [26, "2026-11-22", "expense", "dining", 62.4, "Sushi House", "Date night"],
  [27, "2026-11-23", "expense", "utilities", 64.2, "City Water", "Water bill"],
  [28, "2026-11-24", "expense", "groceries", 41.2, "FreshMart", "Top-up shop"],
  [29, "2026-11-25", "expense", "shopping", 53.5, "Target", "Household supplies"],
  [30, "2026-11-26", "expense", "other", 42.0, "Post Office", "Thanksgiving cards and stamps"],
];

const KEY = "homebudget-v1";

function seed() {
  return {
    transactions: SEED_ROWS.map(([id, date, type, category, amount, payee, note]) => ({
      id, date, type, category, amount, payee, note,
    })),
    budgets: { ...SEED_BUDGETS },
    goals: SEED_GOALS.map((g) => ({ ...g })),
    nextId: 31,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.transactions) && data.budgets && Array.isArray(data.goals)) {
        return data;
      }
    }
  } catch {
    // Corrupt storage: fall through to the seed.
  }
  const data = seed();
  save(data);
  return data;
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable: the page still works in memory.
  }
}

export function reset() {
  const data = seed();
  save(data);
  return data;
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export function totalsFor(data, month) {
  // month is "YYYY-MM"; undefined means all transactions.
  const rows = month
    ? data.transactions.filter((t) => t.date.startsWith(month))
    : data.transactions;
  let income = 0;
  let expenses = 0;
  const byCategory = {};
  for (const c of CATEGORIES) byCategory[c.id] = 0;
  for (const t of rows) {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expenses += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }
  return { income, expenses, balance: income - expenses, byCategory };
}

export function monthTotals(data) {
  // Six-month trend: history months plus the current November totals.
  const nov = totalsFor(data, "2026-11");
  return [...HISTORY, { month: "Nov 2026", income: nov.income, expenses: nov.expenses }];
}

export function fmt(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmt0(n) {
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}
