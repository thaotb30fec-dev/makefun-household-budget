// HomeBudget — single-page app with a hash router.
// Routes: #/ (Dashboard), #/transactions, #/budgets, #/goals, #/reports.
// Every control works: add, edit and delete transactions; edit budgets;
// add funds to goals and create new ones; filter and search. All data lives
// in localStorage (see data.js) — no network requests anywhere.

import {
  CATEGORIES, MONTH, HISTORY, load, save, reset, categoryById,
  totalsFor, monthTotals, fmt, fmt0, pct,
} from "./data.js";
import { drawDonut, drawBars } from "./charts.js";

const NOV = "2026-11";
let data = load();
let editingId = null;
let redrawCharts = null;

const view = document.getElementById("view");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function moneyInput(v) {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function dateLabel(iso) {
  const [, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[Number(m) - 1] + " " + Number(d);
}

function nav(active) {
  const links = [
    ["#/", "Dashboard"],
    ["#/transactions", "Transactions"],
    ["#/budgets", "Budgets"],
    ["#/goals", "Goals"],
    ["#/reports", "Reports"],
  ];
  return `<nav class="topnav" aria-label="Sections">${links
    .map(([href, label]) => `<a href="${href}" class="${href === active ? "active" : ""}">${label}</a>`)
    .join("")}</nav>`;
}

function summaryCards(t) {
  const saved = Math.max(0, t.balance);
  const rate = t.income > 0 ? Math.round((saved / t.income) * 100) : 0;
  return `<section class="cards" aria-label="Month summary">
    <div class="card stat"><span class="stat-label">Income</span><strong class="income">${fmt(t.income)}</strong><span class="stat-sub">November 2026</span></div>
    <div class="card stat"><span class="stat-label">Expenses</span><strong class="expense">${fmt(t.expenses)}</strong><span class="stat-sub">${t.expenses > 0 ? fmt0(t.expenses / 27) + " per day so far" : ""}</span></div>
    <div class="card stat"><span class="stat-label">Balance left</span><strong class="${t.balance >= 0 ? "income" : "expense"}">${fmt(t.balance)}</strong><span class="stat-sub">${rate}% saved of income</span></div>
    <div class="card stat"><span class="stat-label">Savings rate</span><strong>${rate}%</strong><span class="stat-sub">Goal: 20% · ${rate >= 20 ? "on track" : "below goal"}</span></div>
  </section>`;
}

function budgetBar(catId, spent, budget) {
  const p = pct(spent, budget);
  const cls = p > 100 ? "over" : p >= 85 ? "warn" : "";
  return `<div class="budget-row">
    <div class="budget-head"><span><span class="dot" style="background:${categoryById(catId).color}"></span>${categoryById(catId).name}</span><span>${fmt(spent)} of ${fmt(budget)}</span></div>
    <div class="bar"><div class="fill ${cls}" style="width:${Math.min(100, p)}%"></div></div>
    <div class="budget-sub">${p}% used · ${spent > budget ? fmt(spent - budget) + " over budget" : fmt(budget - spent) + " left"}</div>
  </div>`;
}

function txRow(t) {
  const cat = categoryById(t.category);
  return `<tr>
    <td>${dateLabel(t.date)}</td>
    <td><span class="dot" style="background:${cat.color}"></span>${t.type === "income" ? "Income" : esc(cat.name)}</td>
    <td>${esc(t.payee)}${t.note ? ` <span class="muted">— ${esc(t.note)}</span>` : ""}</td>
    <td class="num ${t.type}">${t.type === "income" ? "+" : "−"}${fmt(t.amount)}</td>
    <td class="actions"><button data-edit="${t.id}" class="btn small">Edit</button> <button data-del="${t.id}" class="btn small danger">Delete</button></td>
  </tr>`;
}

function txForm(prefill) {
  const t = prefill || { date: "2026-11-27", type: "expense", category: "groceries", amount: "", payee: "", note: "" };
  return `<form id="tx-form" class="form" data-editing="${prefill ? prefill.id : ""}">
    <h3>${prefill ? "Edit transaction" : "Add a transaction"}</h3>
    <div class="form-grid">
      <label>Date <input type="date" name="date" value="${esc(t.date)}" required></label>
      <label>Type <select name="type"><option value="expense" ${t.type === "expense" ? "selected" : ""}>Expense</option><option value="income" ${t.type === "income" ? "selected" : ""}>Income</option></select></label>
      <label>Category <select name="category">${CATEGORIES.map((c) => `<option value="${c.id}" ${t.category === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select></label>
      <label>Amount ($) <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" value="${t.amount === "" ? "" : t.amount}" required></label>
      <label>Payee / source <input type="text" name="payee" maxlength="60" placeholder="Where it went" value="${esc(t.payee)}" required></label>
      <label>Note <input type="text" name="note" maxlength="80" placeholder="Optional" value="${esc(t.note || "")}"></label>
    </div>
    <div class="form-actions"><button type="submit" class="btn primary">${prefill ? "Save changes" : "Add transaction"}</button>${prefill ? `<button type="button" class="btn" id="cancel-edit">Cancel</button>` : ""}</div>
    <p class="form-msg" id="tx-msg" role="status"></p>
  </form>`;
}

// ---------------- Dashboard ----------------
function renderDashboard() {
  const t = totalsFor(data, NOV);
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const over = CATEGORIES
    .map((c) => ({ c, spent: t.byCategory[c.id] || 0, budget: data.budgets[c.id] || 0 }))
    .filter((x) => x.budget > 0)
    .sort((a, b) => pct(b.spent, b.budget) - pct(a.spent, a.budget))
    .slice(0, 4);
  view.innerHTML = `
    <header class="page-head"><h1>November budget at a glance</h1><p class="muted">The Alvarez household · ${MONTH} · figures update as you add transactions.</p></header>
    ${summaryCards(t)}
    <div class="grid-2">
      <section class="card"><h2>Where the money went</h2><canvas id="donut" class="chart" height="220" aria-label="Spending by category"></canvas>
        <ul class="legend">${CATEGORIES.filter((c) => (t.byCategory[c.id] || 0) > 0).map((c) => `<li><span class="dot" style="background:${c.color}"></span>${c.name} <strong>${fmt(t.byCategory[c.id])}</strong></li>`).join("")}</ul>
      </section>
      <section class="card"><h2>Budgets to watch</h2>${over.map((x) => budgetBar(x.c.id, x.spent, x.budget)).join("")}<p><a class="btn" href="#/budgets">See all budgets</a></p></section>
    </div>
    <div class="grid-2">
      <section class="card"><h2>Recent transactions</h2><table class="tx"><tbody>${recent.map(txRow).join("")}</tbody></table><p><a class="btn" href="#/transactions">All ${data.transactions.length} transactions</a></p></section>
      <section class="card"><h2>Quick add</h2>${txForm(null)}<h2 class="mt">Savings goals</h2>${data.goals.map((g) => `<p><strong>${esc(g.name)}</strong> — ${fmt(g.saved)} of ${fmt(g.target)} (${pct(g.saved, g.target)}%)</p>`).join("")}<p><a class="btn" href="#/goals">Manage goals</a></p></section>
    </div>`;
  redrawCharts = () => {
    const slices = CATEGORIES.map((c) => ({ label: c.name, value: t.byCategory[c.id] || 0, color: c.color })).filter((s) => s.value > 0);
    drawDonut(document.getElementById("donut"), slices);
  };
  redrawCharts();
}

// ---------------- Transactions ----------------
function renderTransactions() {
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  const fType = params.get("type") || "all";
  const fCat = params.get("cat") || "all";
  const q = (params.get("q") || "").toLowerCase();
  let rows = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  if (fType !== "all") rows = rows.filter((t) => t.type === fType);
  if (fCat !== "all") rows = rows.filter((t) => t.category === fCat);
  if (q) rows = rows.filter((t) => (t.payee + " " + (t.note || "") + " " + categoryById(t.category).name).toLowerCase().includes(q));
  const editing = editingId ? data.transactions.find((t) => t.id === editingId) : null;
  view.innerHTML = `
    <header class="page-head"><h1>Transactions</h1><p class="muted">${data.transactions.length} entries in November 2026 · ${rows.length} shown.</p></header>
    <section class="card"><form id="filter-form" class="filters">
      <label>Type <select name="type"><option value="all">All</option><option value="income" ${fType === "income" ? "selected" : ""}>Income</option><option value="expense" ${fType === "expense" ? "selected" : ""}>Expenses</option></select></label>
      <label>Category <select name="cat"><option value="all">All categories</option>${CATEGORIES.map((c) => `<option value="${c.id}" ${fCat === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select></label>
      <label>Search <input type="search" name="q" placeholder="Payee or note…" value="${esc(params.get("q") || "")}"></label>
      <button type="submit" class="btn primary">Filter</button>
      <a class="btn" href="#/transactions">Clear</a>
    </form></section>
    <section class="card"><table class="tx"><thead><tr><th>Date</th><th>Category</th><th>Payee</th><th class="num">Amount</th><th></th></tr></thead>
    <tbody>${rows.length ? rows.map(txRow).join("") : `<tr><td colspan="5">No transactions match these filters.</td></tr>`}</tbody></table></section>
    <section class="card">${txForm(editing || null)}</section>`;
  redrawCharts = null;
}

// ---------------- Budgets ----------------
function renderBudgets() {
  const t = totalsFor(data, NOV);
  const totalBudget = CATEGORIES.reduce((s, c) => s + (data.budgets[c.id] || 0), 0);
  view.innerHTML = `
    <header class="page-head"><h1>Monthly budgets</h1><p class="muted">Planned spending ${fmt(totalBudget)} · actually spent ${fmt(t.expenses)} in November.</p></header>
    <section class="card">${CATEGORIES.map((c) => {
      const spent = t.byCategory[c.id] || 0;
      const budget = data.budgets[c.id] || 0;
      return `<div class="budget-edit">${budgetBar(c.id, spent, budget)}
        <form class="budget-form" data-cat="${c.id}"><label>Monthly budget ($) <input type="number" name="budget" min="0" step="1" value="${budget}" required></label><button type="submit" class="btn small primary">Save</button></form></div>`;
    }).join("")}</section>
    <p class="muted">Tip: budgets are monthly caps. Spending over 100% shows in red; 85–100% in amber.</p>`;
  redrawCharts = null;
}

// ---------------- Goals ----------------
function renderGoals() {
  view.innerHTML = `
    <header class="page-head"><h1>Savings goals</h1><p class="muted">Every dollar saved is a dollar toward something the family wants.</p></header>
    <div class="grid-2">${data.goals.map((g) => {
      const p = pct(g.saved, g.target);
      return `<section class="card"><h2>${esc(g.name)}</h2><p class="muted">${esc(g.note || "")}</p>
        <p class="big">${fmt(g.saved)} <span class="muted">of ${fmt(g.target)}</span></p>
        <div class="bar"><div class="fill ${p >= 100 ? "good" : ""}" style="width:${Math.min(100, p)}%"></div></div>
        <p>${p}% funded · ${fmt(Math.max(0, g.target - g.saved))} to go</p>
        <form class="goal-form" data-goal="${g.id}"><label>Add savings ($) <input type="number" name="amount" min="1" step="1" placeholder="50" required></label><button type="submit" class="btn small primary">Add</button></form>
      </section>`;
    }).join("")}</div>
    <section class="card"><form id="goal-new" class="form"><h3>Start a new goal</h3>
      <div class="form-grid">
        <label>Goal name <input type="text" name="name" maxlength="50" placeholder="e.g. Holiday gifts" required></label>
        <label>Target amount ($) <input type="number" name="target" min="1" step="1" placeholder="500" required></label>
        <label>Already saved ($) <input type="number" name="saved" min="0" step="1" value="0"></label>
        <label>Note <input type="text" name="note" maxlength="80" placeholder="Optional"></label>
      </div>
      <div class="form-actions"><button type="submit" class="btn primary">Create goal</button></div>
      <p class="form-msg" id="goal-msg" role="status"></p>
    </form></section>`;
  redrawCharts = null;
}

// ---------------- Reports ----------------
function renderReports() {
  const t = totalsFor(data, NOV);
  const months = monthTotals(data);
  const topCat = CATEGORIES.map((c) => ({ c, spent: t.byCategory[c.id] || 0 })).sort((a, b) => b.spent - a.spent)[0];
  const biggest = [...data.transactions].filter((x) => x.type === "expense").sort((a, b) => b.amount - a.amount)[0];
  const avgDay = t.expenses / 27;
  const totalSaved = data.goals.reduce((s, g) => s + g.saved, 0);
  view.innerHTML = `
    <header class="page-head"><h1>Reports</h1><p class="muted">Six months of the Alvarez household, June–November 2026.</p></header>
    <div class="grid-2">
      <section class="card"><h2>Income vs expenses</h2><canvas id="bars" class="chart tall" height="260" aria-label="Monthly income and expenses"></canvas>
        <p class="muted"><span class="swatch" style="background:#16a34a"></span> Income &nbsp; <span class="swatch" style="background:#dc2626"></span> Expenses</p></section>
      <section class="card"><h2>November spending mix</h2><canvas id="donut" class="chart" height="220" aria-label="Spending by category"></canvas>
        <ul class="legend">${CATEGORIES.filter((c) => (t.byCategory[c.id] || 0) > 0).map((c) => `<li><span class="dot" style="background:${c.color}"></span>${c.name} <strong>${fmt(t.byCategory[c.id])}</strong></li>`).join("")}</ul></section>
    </div>
    <section class="card"><h2>What the numbers say</h2><ul class="insights">
      <li><strong>Biggest category:</strong> ${topCat.c.name} at ${fmt(topCat.spent)} — ${pct(topCat.spent, t.expenses)}% of November spending.</li>
      <li><strong>Biggest single expense:</strong> ${fmt(biggest.amount)} for ${esc(biggest.payee)} on ${dateLabel(biggest.date)}.</li>
      <li><strong>Daily average:</strong> ${fmt(avgDay)} a day in November, on track for about ${fmt0(avgDay * 30)} for the month.</li>
      <li><strong>Savings rate:</strong> ${t.income > 0 ? Math.round((Math.max(0, t.balance) / t.income) * 100) : 0}% of income left over, plus ${fmt(totalSaved)} already set aside in goals.</li>
      <li><strong>Trend:</strong> expenses fell from ${fmt(HISTORY[4].expenses)} in October to ${fmt(t.expenses)} so far in November, while income held steady.</li>
    </ul></section>`;
  redrawCharts = () => {
    drawBars(document.getElementById("bars"), months);
    const slices = CATEGORIES.map((c) => ({ label: c.name, value: t.byCategory[c.id] || 0, color: c.color })).filter((s) => s.value > 0);
    drawDonut(document.getElementById("donut"), slices);
  };
  redrawCharts();
}

// ---------------- Router & events ----------------
const ROUTES = {
  "/": renderDashboard,
  "/transactions": renderTransactions,
  "/budgets": renderBudgets,
  "/goals": renderGoals,
  "/reports": renderReports,
};

function route() {
  const hash = location.hash || "#/";
  const path = hash.split("?")[0].replace(/^#/, "") || "/";
  (ROUTES[path] || renderDashboard)();
  document.querySelectorAll(".topnav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + path);
  });
  window.scrollTo(0, 0);
}

function rerender() {
  save(data);
  route();
}

view.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  if (form.id === "tx-form") {
    const fd = new FormData(form);
    const amount = moneyInput(fd.get("amount"));
    const msg = document.getElementById("tx-msg");
    if (!amount) { msg.textContent = "Enter an amount greater than $0."; return; }
    if (!fd.get("payee").trim()) { msg.textContent = "Enter a payee or source."; return; }
    const editing = form.dataset.editing ? Number(form.dataset.editing) : null;
    const entry = {
      id: editing || data.nextId,
      date: fd.get("date"),
      type: fd.get("type"),
      category: fd.get("category"),
      amount,
      payee: fd.get("payee").trim(),
      note: (fd.get("note") || "").trim(),
    };
    if (editing) {
      const i = data.transactions.findIndex((x) => x.id === editing);
      if (i >= 0) data.transactions[i] = entry;
      editingId = null;
      msg.textContent = "Transaction updated.";
    } else {
      data.transactions.push(entry);
      data.nextId += 1;
      msg.textContent = "Transaction added.";
    }
    rerender();
    const m2 = document.getElementById("tx-msg");
    if (m2) m2.textContent = msg.textContent;
  } else if (form.id === "filter-form") {
    const fd = new FormData(form);
    const p = new URLSearchParams();
    if (fd.get("type") !== "all") p.set("type", fd.get("type"));
    if (fd.get("cat") !== "all") p.set("cat", fd.get("cat"));
    if (fd.get("q")) p.set("q", fd.get("q"));
    location.hash = "#/transactions" + (p.toString() ? "?" + p.toString() : "");
  } else if (form.classList.contains("budget-form")) {
    const amount = moneyInput(form.budget.value);
    if (amount === null && Number(form.budget.value) !== 0) return;
    data.budgets[form.dataset.cat] = Number(form.budget.value) || 0;
    rerender();
  } else if (form.classList.contains("goal-form")) {
    const amount = moneyInput(form.amount.value);
    if (!amount) return;
    const g = data.goals.find((x) => x.id === form.dataset.goal);
    if (g) g.saved = Math.round((g.saved + amount) * 100) / 100;
    rerender();
  } else if (form.id === "goal-new") {
    const fd = new FormData(form);
    const target = moneyInput(fd.get("target"));
    const msg = document.getElementById("goal-msg");
    if (!target) { msg.textContent = "Enter a target amount greater than $0."; return; }
    data.goals.push({
      id: "g" + Date.now(),
      name: fd.get("name").trim(),
      target,
      saved: Number(fd.get("saved")) || 0,
      note: (fd.get("note") || "").trim(),
    });
    rerender();
  }
});

view.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-del]");
  if (editBtn) {
    editingId = Number(editBtn.dataset.edit);
    route();
    document.getElementById("tx-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (delBtn) {
    const id = Number(delBtn.dataset.del);
    data.transactions = data.transactions.filter((t) => t.id !== id);
    rerender();
  } else if (e.target.id === "cancel-edit") {
    editingId = null;
    route();
  }
});

document.getElementById("reset-demo").addEventListener("click", () => {
  data = reset();
  editingId = null;
  rerender();
});

window.addEventListener("hashchange", route);
window.addEventListener("resize", () => {
  if (redrawCharts) redrawCharts();
});

route();
