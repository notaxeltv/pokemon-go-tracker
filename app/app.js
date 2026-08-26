/* Pokémon GO Tracker — app desktop web offline */

const STORAGE_KEY = "pokemon-go-tracker-data";

const GEN_TOTALS = { 1: 151, 2: 100, 3: 135, 4: 107, 5: 156, 6: 72, 7: 88, 8: 96, 9: 120 };

// Tabella XP cumulativo (aggiornamento livelli 1–80, ottobre 2025)
const XP_TABLE = [
  0, 2500, 5500, 9000, 13000, 18000, 24000, 31000, 39000, 48000,
  58000, 70000, 84000, 100000, 118000, 139000, 163500, 191500, 223000, 258000,
  300000, 349000, 405000, 468000, 538000, 621000, 717000, 826000, 948000, 1083000,
  1241000, 1422000, 1626000, 1853000, 2103000, 2393000, 2723000, 3093000, 3503000, 3953000,
  4473000, 5063000, 5723000, 6453000, 7253000, 8153000, 9153000, 10253000, 11453000, 12753000,
  14193000, 15773000, 17493000, 19353000, 21353000, 23553000, 25953000, 28553000, 31353000, 34353000,
  37703000, 41403000, 45453000, 49853000, 54603000, 59853000, 65603000, 71853000, 78603000, 85853000,
  93853000, 102603000, 112103000, 122353000, 133353000, 145353000, 158353000, 172353000, 187353000, 203353000,
];

const MAX_LEVEL = 80;

const MEDALS = [
  { name: "Studente", desc: "Tipo Normale", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Cintura Nera", desc: "Tipo Lotta", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Avicoltore", desc: "Tipo Volante", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Punk", desc: "Tipo Veleno", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Archeologo", desc: "Tipo Terra", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Alpinista", desc: "Tipo Roccia", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Cacciabug", desc: "Tipo Coleottero", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Stregone", desc: "Tipo Spettro", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Spedizioniere", desc: "Tipo Acciaio", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Accendino", desc: "Tipo Fuoco", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Nuotatore", desc: "Tipo Acqua", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Giardiniere", desc: "Tipo Erba", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Chitarrista", desc: "Tipo Elettro", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Sensitivo", desc: "Tipo Psico", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Sciatore", desc: "Tipo Ghiaccio", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Domatore", desc: "Tipo Drago", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Fata", desc: "Tipo Folletto", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Delinquente", desc: "Tipo Buio", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Collezionista", desc: "Pokémon unici catturati", bronze: 30, silver: 500, gold: 2000, platinum: 50000 },
  { name: "Podista", desc: "Km percorsi", bronze: 10, silver: 26.2, gold: 1000, platinum: 2500 },
  { name: "Scienziato", desc: "Evoluzioni", bronze: 3, silver: 20, gold: 200, platinum: 2500 },
  { name: "Allevatore", desc: "Uova schiuse", bronze: 10, silver: 100, gold: 500, platinum: 2500 },
  { name: "Combattente", desc: "Battaglie in palestra vinte", bronze: 10, silver: 100, gold: 1000, platinum: 4000 },
  { name: "Gentiluomo", desc: "Raid vinti", bronze: 10, silver: 100, gold: 1000, platinum: 2500 },
  { name: "Idolo", desc: "Raid leggendari vinti", bronze: 2, silver: 10, gold: 50, platinum: 100 },
  { name: "Campione", desc: "Raid leggendari vinti", bronze: 10, silver: 100, gold: 250, platinum: 1000 },
  { name: "Esperto Bacche", desc: "Bacche date", bronze: 10, silver: 100, gold: 1000, platinum: 15000 },
  { name: "Gamer", desc: "Curveball", bronze: 1000, silver: 100000, gold: 1000000, platinum: 2000000 },
  { name: "Fotografo", desc: "Foto scattate", bronze: 10, silver: 50, gold: 200, platinum: 2500 },
  { name: "Giovanotto", desc: "Pokémon minuscoli", bronze: 3, silver: 50, gold: 300, platinum: 1000 },
  { name: "Pescatore", desc: "Pokémon enormi", bronze: 3, silver: 50, gold: 300, platinum: 1000 },
  { name: "Asso", desc: "Sessioni di addestramento", bronze: 10, silver: 100, gold: 1000, platinum: 2000 },
];

const LEGENDARIES = [
  "Articuno", "Zapdos", "Moltres", "Mewtwo", "Raikou", "Entei", "Suicune",
  "Lugia", "Ho-Oh", "Regirock", "Regice", "Registeel", "Latias", "Latios",
  "Kyogre", "Groudon", "Rayquaza", "Uxie", "Mesprit", "Azelf", "Dialga",
  "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia", "Cobalion",
  "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram", "Zekrom",
  "Landorus", "Kyurem", "Xerneas", "Yveltal", "Zygarde", "Tapu Koko",
  "Tapu Lele", "Tapu Bulu", "Tapu Fini", "Solgaleo", "Lunala", "Necrozma",
  "Zacian", "Zamazenta", "Eternatus", "Regieleki", "Regidrago", "Glastrier",
  "Spectrier", "Calyrex", "Koraidon", "Miraidon",
];

let state = null;
let saveTimer = null;

function defaultState() {
  return {
    version: 1,
    resources: {
      stardust: 0,
      stardustPowder: 0,
      pokeballs: 0,
      megaEnergy: 0,
      totalXp: 0,
    },
    pokedex: Object.fromEntries(
      Object.keys(GEN_TOTALS).map((g) => [g, { caught: 0, seen: 0 }])
    ),
    shiny: [],
    medals: MEDALS.map((m) => ({ progress: 0 })),
    battles: {
      raid: { wins: 0, losses: 0 },
      gbl: { wins: 0, losses: 0 },
      buddy: { km: 0, candies: 0, hearts: 0 },
    },
    legendaries: LEGENDARIES.map((name) => ({
      name,
      caught: false,
      shiny: false,
      iv: "",
      date: "",
      attempts: 0,
      catches: 0,
    })),
  };
}

/* ── Calcoli ── */

function calcIvPercent(att, def, sta) {
  const a = Number(att), d = Number(def), s = Number(sta);
  if ([a, d, s].some((v) => isNaN(v) || v === "")) return null;
  return Math.round(((a + d + s) / 45) * 10000) / 100;
}

function calcWinRate(wins, losses) {
  const total = wins + losses;
  return total === 0 ? 0 : wins / total;
}

function calcMedalTier(progress, thresholds) {
  const { bronze, silver, gold, platinum } = thresholds;
  if (progress >= platinum) return "Platino";
  if (progress >= gold) return "Oro";
  if (progress >= silver) return "Argento";
  if (progress >= bronze) return "Bronzo";
  return "Nessuno";
}

function calcMedalProgress(progress, thresholds) {
  const { bronze, silver, gold, platinum } = thresholds;
  if (progress >= platinum) return 1;
  if (progress >= gold) return (progress - gold) / (platinum - gold);
  if (progress >= silver) return (progress - silver) / (gold - silver);
  if (progress >= bronze) return (progress - bronze) / (silver - bronze);
  return bronze === 0 ? 0 : progress / bronze;
}

function calcLevelFromXp(xp) {
  let level = 1;
  for (let i = 0; i < XP_TABLE.length; i++) {
    if (xp >= XP_TABLE[i]) level = i + 1;
    else break;
  }
  return Math.min(level, MAX_LEVEL);
}

function calcXpInfo(xp) {
  const level = calcLevelFromXp(xp);
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, currentXp: xp, nextLevelXp: XP_TABLE[MAX_LEVEL - 1], xpInLevel: 0, xpNeeded: 0, progress: 1 };
  }
  const currentLevelXp = XP_TABLE[level - 1];
  const nextLevelXp = XP_TABLE[level];
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return {
    level,
    currentXp: xp,
    nextLevelXp,
    xpInLevel,
    xpNeeded,
    progress: xpNeeded > 0 ? xpInLevel / xpNeeded : 0,
  };
}

function pokedexTotals() {
  let total = 0, caught = 0, seen = 0;
  for (const gen of Object.keys(GEN_TOTALS)) {
    total += GEN_TOTALS[gen];
    caught += state.pokedex[gen].caught;
    seen += state.pokedex[gen].seen;
  }
  return {
    total,
    caught,
    seen,
    missing: total - caught,
    caughtPct: total ? caught / total : 0,
    seenPct: total ? seen / total : 0,
  };
}

/* ── Persistenza ── */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return mergeState(defaultState(), parsed);
    }
  } catch (e) {
    console.warn("Impossibile caricare dati:", e);
  }
  return defaultState();
}

function mergeState(base, incoming) {
  const merged = structuredClone(base);
  if (incoming.resources) Object.assign(merged.resources, incoming.resources);
  if (incoming.pokedex) {
    for (const g of Object.keys(merged.pokedex)) {
      if (incoming.pokedex[g]) Object.assign(merged.pokedex[g], incoming.pokedex[g]);
    }
  }
  if (Array.isArray(incoming.shiny)) merged.shiny = incoming.shiny;
  if (Array.isArray(incoming.medals)) {
    incoming.medals.forEach((m, i) => {
      if (merged.medals[i]) merged.medals[i].progress = m.progress ?? 0;
    });
  }
  if (incoming.battles) {
    Object.assign(merged.battles.raid, incoming.battles.raid || {});
    Object.assign(merged.battles.gbl, incoming.battles.gbl || {});
    Object.assign(merged.battles.buddy, incoming.battles.buddy || {});
  }
  if (Array.isArray(incoming.legendaries)) {
    incoming.legendaries.forEach((leg, i) => {
      if (merged.legendaries[i]) Object.assign(merged.legendaries[i], leg);
    });
  }
  return merged;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const el = document.getElementById("save-status");
  if (el) {
    el.textContent = "Salvato ✓";
    el.style.color = "var(--success)";
  }
}

function scheduleSave() {
  const el = document.getElementById("save-status");
  if (el) {
    el.textContent = "Salvataggio...";
    el.style.color = "var(--warning)";
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}

function updateState(mutator) {
  mutator(state);
  scheduleSave();
  renderAll();
}

/* ── Formattazione ── */

function fmtNum(n) {
  return new Intl.NumberFormat("it-IT").format(n);
}

function fmtPct(n) {
  return new Intl.NumberFormat("it-IT", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
}

function fmtPct2(n) {
  return new Intl.NumberFormat("it-IT", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function tierClass(tier) {
  return "tier-" + tier.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/* ── Rendering ── */

function renderAll() {
  renderDashboard();
  renderPokedex();
  renderShiny();
  renderResources();
  renderMedals();
  renderBattles();
  renderLegendaries();
}

function renderDashboard() {
  const dex = pokedexTotals();
  const xpInfo = calcXpInfo(state.resources.totalXp);
  const raidWr = calcWinRate(state.battles.raid.wins, state.battles.raid.losses);
  const gblWr = calcWinRate(state.battles.gbl.wins, state.battles.gbl.losses);
  const shinyCount = state.shiny.filter((s) => s.pokemon && s.pokemon.trim()).length;
  const legCaught = state.legendaries.filter((l) => l.caught).length;
  const legShiny = state.legendaries.filter((l) => l.shiny).length;

  const cards = [
    { label: "Stardust", value: fmtNum(state.resources.stardust) },
    { label: "Polvere Lucente", value: fmtNum(state.resources.stardustPowder) },
    { label: "Livello", value: xpInfo.level, accent: true },
    { label: "XP Totale", value: fmtNum(state.resources.totalXp) },
    { label: "Pokédex Catturati", value: `${dex.caught} / ${dex.total}`, success: true },
    { label: "% Pokédex", value: fmtPct(dex.caughtPct), success: true },
    { label: "% Visti", value: fmtPct(dex.seenPct) },
    { label: "Shiny Registrati", value: shinyCount, warning: true },
    { label: "Raid Win Rate", value: fmtPct(raidWr) },
    { label: "GBL Win Rate", value: fmtPct(gblWr) },
    { label: "Leggendari Catturati", value: `${legCaught} / ${LEGENDARIES.length}`, accent: true },
    { label: "Leggendari Shiny", value: legShiny, warning: true },
  ];

  document.getElementById("dashboard-cards").innerHTML = cards
    .map((c) => `
      <div class="card">
        <div class="card-label">${c.label}</div>
        <div class="card-value${c.accent ? " accent" : ""}${c.success ? " success" : ""}${c.warning ? " warning" : ""}">${c.value}</div>
      </div>`)
    .join("");
}

function renderPokedex() {
  const body = document.getElementById("pokedex-body");
  body.innerHTML = Object.keys(GEN_TOTALS)
    .map((gen) => {
      const total = GEN_TOTALS[gen];
      const { caught, seen } = state.pokedex[gen];
      const missing = total - caught;
      const caughtPct = total ? caught / total : 0;
      const seenPct = total ? seen / total : 0;
      return `
        <tr>
          <td>Gen ${gen}</td>
          <td>${total}</td>
          <td><input type="number" class="table-input" min="0" max="${total}" value="${caught}"
            data-gen="${gen}" data-field="caught"></td>
          <td><input type="number" class="table-input" min="0" max="${total}" value="${seen}"
            data-gen="${gen}" data-field="seen"></td>
          <td class="computed">${missing}</td>
          <td class="computed">${fmtPct(caughtPct)}</td>
          <td class="computed">${fmtPct(seenPct)}</td>
        </tr>`;
    })
    .join("");

  const dex = pokedexTotals();
  document.getElementById("pokedex-foot").innerHTML = `
    <tr>
      <td>TOTALE</td>
      <td>${dex.total}</td>
      <td>${dex.caught}</td>
      <td>${dex.seen}</td>
      <td class="computed">${dex.missing}</td>
      <td class="computed">${fmtPct(dex.caughtPct)}</td>
      <td class="computed">${fmtPct(dex.seenPct)}</td>
    </tr>`;

  body.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const gen = input.dataset.gen;
      const field = input.dataset.field;
      const val = Math.max(0, parseInt(input.value, 10) || 0);
      updateState((s) => { s.pokedex[gen][field] = val; });
    });
  });
}

function renderShiny() {
  const body = document.getElementById("shiny-body");
  if (state.shiny.length === 0) {
    body.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:24px">
      Nessuno shiny registrato. Clicca "Aggiungi Shiny" per iniziare.</td></tr>`;
    return;
  }

  body.innerHTML = state.shiny
    .map((row, i) => {
      const iv = calcIvPercent(row.att, row.def, row.sta);
      return `
        <tr data-idx="${i}">
          <td><input type="date" class="table-input" value="${row.date || ""}" data-field="date"></td>
          <td><input type="text" class="table-input" value="${esc(row.pokemon)}" data-field="pokemon" placeholder="Nome"></td>
          <td><input type="number" class="table-input" min="0" value="${row.cp ?? ""}" data-field="cp"></td>
          <td><input type="number" class="table-input" min="0" max="15" value="${row.att ?? ""}" data-field="att"></td>
          <td><input type="number" class="table-input" min="0" max="15" value="${row.def ?? ""}" data-field="def"></td>
          <td><input type="number" class="table-input" min="0" max="15" value="${row.sta ?? ""}" data-field="sta"></td>
          <td class="computed">${iv !== null ? iv + "%" : "—"}</td>
          <td><input type="text" class="table-input" value="${esc(row.method)}" data-field="method" placeholder="Raid, Wild..."></td>
          <td><input type="text" class="table-input" value="${esc(row.notes)}" data-field="notes"></td>
          <td><button class="btn btn-danger btn-del-shiny" data-idx="${i}">✕</button></td>
        </tr>`;
    })
    .join("");

  body.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const tr = input.closest("tr");
      const idx = parseInt(tr.dataset.idx, 10);
      const field = input.dataset.field;
      updateState((s) => {
        s.shiny[idx][field] = ["cp", "att", "def", "sta"].includes(field)
          ? (input.value === "" ? "" : Number(input.value))
          : input.value;
      });
    });
  });

  body.querySelectorAll(".btn-del-shiny").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx, 10);
      updateState((s) => { s.shiny.splice(idx, 1); });
    });
  });
}

function renderResources() {
  const r = state.resources;
  const fields = [
    { key: "stardust", label: "Stardust" },
    { key: "stardustPowder", label: "Polvere Lucente" },
    { key: "pokeballs", label: "Poké Ball" },
    { key: "megaEnergy", label: "Mega Energy" },
    { key: "totalXp", label: "XP Totale" },
  ];

  document.getElementById("resources-form").innerHTML = fields
    .map((f) => `
      <div class="form-field">
        <label>${f.label}</label>
        <input type="number" min="0" id="res-${f.key}" value="${r[f.key]}">
      </div>`)
    .join("");

  fields.forEach((f) => {
    document.getElementById(`res-${f.key}`).addEventListener("change", (e) => {
      updateState((s) => {
        s.resources[f.key] = Math.max(0, parseInt(e.target.value, 10) || 0);
      });
    });
  });

  const xp = calcXpInfo(r.totalXp);
  document.getElementById("xp-progress").innerHTML = `
    <h3>Livello ${xp.level}${xp.level >= MAX_LEVEL ? " (MAX)" : ` → ${xp.level + 1}`}</h3>
    <div class="progress-bar-wrap">
      <div class="progress-bar" style="width:${(xp.progress * 100).toFixed(1)}%"></div>
    </div>
    <div class="xp-stats">
      <span>XP attuale: ${fmtNum(xp.currentXp)}</span>
      ${xp.level < MAX_LEVEL
        ? `<span>Mancano ${fmtNum(xp.xpNeeded - xp.xpInLevel)} XP al livello ${xp.level + 1}</span>`
        : "<span>Livello massimo raggiunto!</span>"}
    </div>
    ${xp.level >= 70 && xp.level < MAX_LEVEL
      ? '<p class="xp-note">I livelli 71–80 richiedono anche ricerche di salita di livello oltre all\'XP.</p>'
      : ""}`;
}

function renderMedals() {
  const body = document.getElementById("medals-body");
  body.innerHTML = MEDALS.map((m, i) => {
    const progress = state.medals[i].progress;
    const tier = calcMedalTier(progress, m);
    const pct = calcMedalProgress(progress, m);
    return `
      <tr>
        <td>${m.name}</td>
        <td style="color:var(--text-secondary)">${m.desc}</td>
        <td><input type="number" class="table-input" min="0" step="any" value="${progress}" data-idx="${i}"></td>
        <td>${fmtNum(m.bronze)}</td>
        <td>${fmtNum(m.silver)}</td>
        <td>${fmtNum(m.gold)}</td>
        <td>${fmtNum(m.platinum)}</td>
        <td class="computed ${tierClass(tier)}">${tier}</td>
        <td class="computed">${tier === "Platino" ? "100%" : fmtPct(pct)}</td>
      </tr>`;
  }).join("");

  body.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const idx = parseInt(input.dataset.idx, 10);
      updateState((s) => {
        s.medals[idx].progress = Math.max(0, parseFloat(input.value) || 0);
      });
    });
  });
}

function renderBattles() {
  const b = state.battles;
  const raidWr = calcWinRate(b.raid.wins, b.raid.losses);
  const gblWr = calcWinRate(b.gbl.wins, b.gbl.losses);
  const candiesKm = b.buddy.km > 0 ? (b.buddy.candies / b.buddy.km).toFixed(2) : "0";

  document.getElementById("battles-grid").innerHTML = `
    <div class="battle-card" id="card-raid">
      <h3>⚔️ Raid</h3>
      <div class="battle-field"><label>Vittorie</label>
        <input type="number" min="0" id="raid-wins" value="${b.raid.wins}"></div>
      <div class="battle-field"><label>Sconfitte</label>
        <input type="number" min="0" id="raid-losses" value="${b.raid.losses}"></div>
      <div class="battle-result"><span class="label">Win Rate</span><span class="value">${fmtPct(raidWr)}</span></div>
    </div>
    <div class="battle-card" id="card-gbl">
      <h3>🏆 Go Battle League</h3>
      <div class="battle-field"><label>Vittorie</label>
        <input type="number" min="0" id="gbl-wins" value="${b.gbl.wins}"></div>
      <div class="battle-field"><label>Sconfitte</label>
        <input type="number" min="0" id="gbl-losses" value="${b.gbl.losses}"></div>
      <div class="battle-result"><span class="label">Win Rate</span><span class="value">${fmtPct(gblWr)}</span></div>
    </div>
    <div class="battle-card" id="card-buddy">
      <h3>🐾 Buddy</h3>
      <div class="battle-field"><label>Km percorsi</label>
        <input type="number" min="0" step="0.1" id="buddy-km" value="${b.buddy.km}"></div>
      <div class="battle-field"><label>Caramelle</label>
        <input type="number" min="0" id="buddy-candies" value="${b.buddy.candies}"></div>
      <div class="battle-field"><label>Cuori</label>
        <input type="number" min="0" id="buddy-hearts" value="${b.buddy.hearts}"></div>
      <div class="battle-result"><span class="label">Caramelle / Km</span><span class="value">${candiesKm}</span></div>
    </div>`;

  const bind = (id, path, parser = (v) => Math.max(0, parseInt(v, 10) || 0)) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const val = parser(e.target.value);
      updateState((s) => {
        const parts = path.split(".");
        s.battles[parts[0]][parts[1]] = val;
      });
    });
  };

  bind("raid-wins", "raid.wins");
  bind("raid-losses", "raid.losses");
  bind("gbl-wins", "gbl.wins");
  bind("gbl-losses", "gbl.losses");
  bind("buddy-km", "buddy.km", (v) => Math.max(0, parseFloat(v) || 0));
  bind("buddy-candies", "buddy.candies");
  bind("buddy-hearts", "buddy.hearts");
}

function renderLegendaries() {
  const body = document.getElementById("legendaries-body");
  body.innerHTML = state.legendaries
    .map((leg, i) => {
      const wr = leg.attempts > 0 ? leg.catches / leg.attempts : 0;
      return `
        <tr data-idx="${i}">
          <td>${leg.name}</td>
          <td><select data-field="caught">
            <option value="false" ${!leg.caught ? "selected" : ""}>No</option>
            <option value="true" ${leg.caught ? "selected" : ""}>Sì</option>
          </select></td>
          <td><select data-field="shiny">
            <option value="false" ${!leg.shiny ? "selected" : ""}>No</option>
            <option value="true" ${leg.shiny ? "selected" : ""}>Sì</option>
          </select></td>
          <td><input type="number" class="table-input" min="0" max="100" step="0.01" value="${leg.iv}" data-field="iv" placeholder="%"></td>
          <td><input type="date" class="table-input" value="${leg.date || ""}" data-field="date"></td>
          <td><input type="number" class="table-input" min="0" value="${leg.attempts}" data-field="attempts"></td>
          <td><input type="number" class="table-input" min="0" value="${leg.catches}" data-field="catches"></td>
          <td class="computed">${fmtPct2(wr)}</td>
        </tr>`;
    })
    .join("");

  body.querySelectorAll("tr").forEach((tr) => {
    const idx = parseInt(tr.dataset.idx, 10);
    tr.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("change", () => {
        const field = el.dataset.field;
        updateState((s) => {
          const leg = s.legendaries[idx];
          if (field === "caught" || field === "shiny") {
            leg[field] = el.value === "true";
          } else if (field === "iv") {
            leg.iv = el.value;
          } else if (field === "date") {
            leg.date = el.value;
          } else {
            leg[field] = Math.max(0, parseInt(el.value, 10) || 0);
          }
        });
      });
    });
  });
}

function esc(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ── Navigazione ── */

function initNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`section-${btn.dataset.section}`).classList.add("active");
    });
  });
}

/* ── Export / Import ── */

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pokemon-go-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      state = mergeState(defaultState(), parsed);
      saveState();
      renderAll();
      alert("Backup importato con successo!");
    } catch (err) {
      alert("Errore durante l'importazione: file JSON non valido.");
    }
  };
  reader.readAsText(file);
}

/* ── Init ── */

function init() {
  state = loadState();
  initNav();
  renderAll();

  document.getElementById("btn-add-shiny").addEventListener("click", () => {
    updateState((s) => {
      s.shiny.push({ date: "", pokemon: "", cp: "", att: "", def: "", sta: "", method: "", notes: "" });
    });
  });

  document.getElementById("btn-export").addEventListener("click", exportData);
  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });
  document.getElementById("import-file").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });
}

document.addEventListener("DOMContentLoaded", init);
