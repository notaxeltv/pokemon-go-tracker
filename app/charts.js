/* Grafici canvas condivisi */

function aggregateHistory(history, period) {
  if (!history || history.length === 0) return [];
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (period === "days") return sorted.map((p) => ({ ...p, label: null }));

  const buckets = new Map();
  for (const point of sorted) {
    const key = period === "months" ? point.date.slice(0, 7) : point.date.slice(0, 4);
    buckets.set(key, point.value);
  }
  return Array.from(buckets.entries()).map(([key, value]) => ({
    date: period === "months" ? `${key}-01` : `${key}-01-01`,
    value,
    label: period === "months"
      ? new Date(`${key}-01`).toLocaleDateString("it-IT", { month: "short", year: "numeric" })
      : key,
  }));
}

function formatChartLabel(point, period) {
  if (point.label) return point.label;
  const d = new Date(point.date + "T12:00:00");
  if (period === "days") return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  return point.date;
}

function drawLineChart(canvas, data, options = {}) {
  const emptyEl = options.emptyEl;
  const period = options.period || "days";
  const color = options.color || "#5b8def";
  const thresholds = options.thresholds || [];
  const valueLabel = options.valueLabel || "Valore";
  const formatValue = options.formatValue || ((v) => fmtNum(Math.round(v)));

  if (!data || data.length === 0) {
    if (emptyEl) { canvas.classList.add("hidden"); emptyEl.classList.remove("hidden"); }
    return;
  }
  if (emptyEl) { canvas.classList.remove("hidden"); emptyEl.classList.add("hidden"); }

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = Math.max(280, rect.width - 16);
  const height = options.height || 260;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const pad = { top: 20, right: 16, bottom: 40, left: 52 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const values = data.map((d) => d.value ?? d.progress);
  const maxVal = Math.max(...values, ...thresholds.map((t) => t.v), 1) * 1.08;
  const xAt = (i) => pad.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const yAt = (v) => pad.top + chartH - (v / maxVal) * chartH;
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--chart-bg").trim() || "#1a1d27";

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  thresholds.forEach((t) => {
    const y = yAt(t.v);
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(width - pad.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "#363b4a";
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + chartH);
  ctx.lineTo(pad.left + chartW, pad.top + chartH);
  ctx.stroke();

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim() || "#9aa0b0";
  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal * i) / 4;
    const y = yAt(val);
    ctx.fillText(formatValue(val), pad.left - 6, y + 3);
  }

  if (data.length > 1) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = xAt(i);
      const y = yAt(point.value ?? point.progress);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  data.forEach((point, i) => {
    const x = xAt(i);
    const y = yAt(point.value ?? point.progress);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, data.length === 1 ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-secondary").trim() || "#9aa0b0";
    ctx.textAlign = "center";
    ctx.fillText(formatChartLabel(point, period), x, height - 12);
  });

  if (options.legendEl) {
    const delta = data.length >= 2 ? values[values.length - 1] - values[0] : 0;
    options.legendEl.innerHTML = `<span>${valueLabel}</span>${delta !== 0 ? `<span>Δ: ${delta >= 0 ? "+" : ""}${formatValue(delta)}</span>` : ""}`;
  }
}

function drawMedalChart(medal, period) {
  const history = (state.medalHistory[medal.id] || []).map((p) => ({ ...p, value: p.progress }));
  const data = aggregateHistory(history, period);
  drawLineChart(document.getElementById("medal-chart"), data, {
    period,
    emptyEl: document.getElementById("medal-chart-empty"),
    thresholds: [
      { v: medal.bronze, color: "rgba(205,127,50,0.35)" },
      { v: medal.silver, color: "rgba(207,216,220,0.25)" },
      { v: medal.gold, color: "rgba(255,213,79,0.2)" },
      { v: medal.platinum, color: "rgba(184,197,255,0.2)" },
    ],
    legendEl: document.getElementById("medal-chart-legend"),
    valueLabel: "Progresso",
  });
  const legend = document.getElementById("medal-chart-legend");
  if (legend && data.length) {
    legend.innerHTML += `
      <span class="legend-item"><span class="legend-swatch bronze"></span> Bronzo (${fmtNum(medal.bronze)})</span>
      <span class="legend-item"><span class="legend-swatch silver"></span> Argento (${fmtNum(medal.silver)})</span>
      <span class="legend-item"><span class="legend-swatch gold"></span> Oro (${fmtNum(medal.gold)})</span>
      <span class="legend-item"><span class="legend-swatch platinum"></span> Platino (${fmtNum(medal.platinum)})</span>`;
  }
}
