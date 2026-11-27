// HomeBudget — canvas charts, drawn in code. No libraries, no network.

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width));
  const h = Math.max(1, Math.round(rect.height));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// Donut of spending by category. slices: [{label, value, color}]
export function drawDonut(canvas, slices) {
  const { ctx, w, h } = setupCanvas(canvas);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 8;
  const inner = r * 0.62;
  ctx.clearRect(0, 0, w, h);
  if (total <= 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No spending yet", cx, cy);
    return;
  }
  let a0 = -Math.PI / 2;
  for (const s of slices) {
    if (s.value <= 0) continue;
    const a1 = a0 + (s.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    a0 = a1;
  }
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$" + Math.round(total).toLocaleString("en-US"), cx, cy - 8);
  ctx.fillStyle = "#64748b";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("spent in November", cx, cy + 12);
}

// Grouped bars: months on the x axis, income (green) vs expenses (red).
// rows: [{label, income, expenses}]
export function drawBars(canvas, rows) {
  const { ctx, w, h } = setupCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const padL = 44;
  const padB = 26;
  const padT = 12;
  const plotW = w - padL - 8;
  const plotH = h - padT - padB;
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.expenses]));
  const nice = Math.ceil(max / 1000) * 1000;
  ctx.strokeStyle = "#e2e8f0";
  ctx.fillStyle = "#64748b";
  ctx.font = "11px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let i = 0; i <= 4; i++) {
    const v = (nice / 4) * i;
    const y = padT + plotH - (v / nice) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - 8, y);
    ctx.stroke();
    ctx.fillText("$" + (v / 1000) + "k", padL - 6, y);
  }
  const slot = plotW / rows.length;
  const bw = Math.min(22, (slot - 16) / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  rows.forEach((r, i) => {
    const x0 = padL + i * slot + (slot - bw * 2 - 4) / 2;
    const hi = (r.income / nice) * plotH;
    const he = (r.expenses / nice) * plotH;
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(x0, padT + plotH - hi, bw, hi);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(x0 + bw + 4, padT + plotH - he, bw, he);
    ctx.fillStyle = "#334155";
    ctx.fillText(r.label, padL + i * slot + slot / 2, padT + plotH + 8);
  });
}
