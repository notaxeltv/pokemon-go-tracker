/* Core: stato, account, storico, calcoli */

const STORAGE_KEY = "pokemon-go-tracker-data";
const GEN_TOTALS = { 1: 151, 2: 100, 3: 135, 4: 107, 5: 156, 6: 72, 7: 88, 8: 96, 9: 120 };

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

let app = null;
let state = null;
let saveTimer = null;

function uid() {
  return "id_" + Math.random().toString(36).slice(2, 10);
}

function defaultAccountData(name = "Allenatore") {
  return {
    name,
    resources: { stardust: 0, stardustPowder: 0, pokeballs: 0, megaEnergy: 0, totalXp: 0 },
    pokedex: Object.fromEntries(Object.keys(GEN_TOTALS).map((g) => [g, { caught: 0, seen: 0 }])),
    speciesDex: {},
    shiny: [],
    medals: Object.fromEntries(MEDALS.map((m) => [m.id, { progress: 0 }])),
    medalHistory: {},
    globalHistory: { xp: [], stardust: [], pokedexPct: [], raidWins: [] },
    battles: {
      raid: { wins: 0, losses: 0 },
      gbl: { wins: 0, losses: 0 },
      buddy: { km: 0, candies: 0, hearts: 0 },
    },
    buddies: [],
    events: [],
    quests: [],
    showcase: [],
    legendaries: LEGENDARIES.map((n) => ({
      name: n, caught: false, shiny: false, iv: "", date: "", attempts: 0, catches: 0,
    })),
  };
}

function defaultApp() {
  const id = "default";
  return {
    version: 3,
    settings: { theme: "dark" },
    activeAccountId: id,
    accounts: { [id]: defaultAccountData("Allenatore principale") },
  };
}

function migrateToV3(raw) {
  if (raw?.version >= 3 && raw.accounts) return raw;
  const data = { ...raw };
  delete data.version;
  return {
    version: 3,
    settings: { theme: "dark" },
    activeAccountId: "default",
    accounts: { default: mergeAccountData(defaultAccountData("Allenatore principale"), data) },
  };
}

function mergeAccountData(base, incoming) {
  const merged = structuredClone(base);
  if (!incoming) return merged;
  if (incoming.name) merged.name = incoming.name;
  if (incoming.resources) Object.assign(merged.resources, incoming.resources);
  if (incoming.pokedex) {
    for (const g of Object.keys(merged.pokedex)) {
      if (incoming.pokedex[g]) Object.assign(merged.pokedex[g], incoming.pokedex[g]);
    }
  }
  if (incoming.speciesDex) merged.speciesDex = { ...merged.speciesDex, ...incoming.speciesDex };
  if (Array.isArray(incoming.shiny)) merged.shiny = incoming.shiny;
  if (incoming.medals) {
    const progressById = {};
    if (Array.isArray(incoming.medals)) {
      incoming.medals.forEach((m, i) => {
        const id = m.id || MEDALS[i]?.id;
        if (id) progressById[id] = m.progress ?? 0;
      });
    } else {
      Object.entries(incoming.medals).forEach(([id, val]) => {
        progressById[id] = typeof val === "object" ? (val.progress ?? 0) : (val ?? 0);
      });
    }
    for (const m of MEDALS) {
      if (progressById[m.id] !== undefined) merged.medals[m.id].progress = progressById[m.id];
    }
  }
  if (incoming.medalHistory) merged.medalHistory = { ...merged.medalHistory, ...incoming.medalHistory };
  if (incoming.globalHistory) {
    for (const k of Object.keys(merged.globalHistory)) {
      if (incoming.globalHistory[k]) merged.globalHistory[k] = incoming.globalHistory[k];
    }
  }
  if (incoming.battles) {
    Object.assign(merged.battles.raid, incoming.battles.raid || {});
    Object.assign(merged.battles.gbl, incoming.battles.gbl || {});
    Object.assign(merged.battles.buddy, incoming.battles.buddy || {});
  }
  if (Array.isArray(incoming.buddies)) merged.buddies = incoming.buddies;
  if (Array.isArray(incoming.events)) merged.events = incoming.events;
  if (Array.isArray(incoming.quests)) merged.quests = incoming.quests;
  if (Array.isArray(incoming.showcase)) merged.showcase = incoming.showcase;
  if (Array.isArray(incoming.legendaries)) {
    incoming.legendaries.forEach((leg, i) => {
      if (merged.legendaries[i]) Object.assign(merged.legendaries[i], leg);
    });
  }
  return merged;
}

function setActiveState() {
  state = app.accounts[app.activeAccountId];
}

function loadApp() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    app = raw ? migrateToV3(JSON.parse(raw)) : defaultApp();
  } catch (e) {
    console.warn("Caricamento fallito:", e);
    app = defaultApp();
  }
  if (!app.accounts[app.activeAccountId]) app.activeAccountId = Object.keys(app.accounts)[0];
  setActiveState();
  applyTheme(app.settings.theme || "dark");
}

function saveApp() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(app));
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
  saveTimer = setTimeout(saveApp, 400);
}

function updateState(mutator, options = {}) {
  mutator(state);
  if (options.syncGen) syncGenFromSpecies(state);
  if (options.recordGlobal !== false) recordGlobalSnapshot();
  scheduleSave();
  renderAll();
}

function switchAccount(id) {
  if (!app.accounts[id]) return;
  app.activeAccountId = id;
  setActiveState();
  seedHistories();
  saveApp();
  renderAll();
}

function createAccount(name) {
  const id = uid();
  app.accounts[id] = defaultAccountData(name || `Account ${Object.keys(app.accounts).length + 1}`);
  app.activeAccountId = id;
  setActiveState();
  saveApp();
  renderAll();
}

function deleteAccount(id) {
  if (Object.keys(app.accounts).length <= 1) return;
  delete app.accounts[id];
  if (app.activeAccountId === id) app.activeAccountId = Object.keys(app.accounts)[0];
  setActiveState();
  saveApp();
  renderAll();
}

function setTheme(theme) {
  app.settings.theme = theme;
  applyTheme(theme);
  saveApp();
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function recordHistoryPoint(history, value) {
  const today = todayISO();
  const last = history[history.length - 1];
  if (last && last.date === today) last.value = value;
  else if (!last || last.value !== value) history.push({ date: today, value });
}

function recordMedalHistory(id, progress) {
  if (!state.medalHistory[id]) state.medalHistory[id] = [];
  recordHistoryPoint(state.medalHistory[id], progress);
}

function recordGlobalSnapshot() {
  const dex = pokedexTotals();
  recordHistoryPoint(state.globalHistory.xp, state.resources.totalXp);
  recordHistoryPoint(state.globalHistory.stardust, state.resources.stardust);
  recordHistoryPoint(state.globalHistory.pokedexPct, Math.round(dex.caughtPct * 10000) / 100);
  recordHistoryPoint(state.globalHistory.raidWins, state.battles.raid.wins);
}

function seedHistories() {
  let changed = false;
  for (const m of MEDALS) {
    const progress = state.medals[m.id]?.progress ?? 0;
    if (progress > 0 && (!state.medalHistory[m.id] || state.medalHistory[m.id].length === 0)) {
      recordMedalHistory(m.id, progress);
      changed = true;
    }
  }
  const dex = pokedexTotals();
  if (state.resources.totalXp > 0 && state.globalHistory.xp.length === 0) { recordGlobalSnapshot(); changed = true; }
  else if (dex.caught > 0 && state.globalHistory.pokedexPct.length === 0) { recordGlobalSnapshot(); changed = true; }
  if (changed) saveApp();
}

function getSpeciesEntry(id) {
  const key = String(id);
  if (!state.speciesDex[key]) state.speciesDex[key] = { caught: false, seen: false, shiny: false };
  return state.speciesDex[key];
}

function syncGenFromSpecies(s) {
  for (const gen of Object.keys(GEN_TOTALS)) {
    const g = Number(gen);
    const list = POKEMON.filter((p) => p.gen === g);
    s.pokedex[gen] = {
      caught: list.filter((p) => s.speciesDex[p.id]?.caught).length,
      seen: list.filter((p) => s.speciesDex[p.id]?.seen).length,
    };
  }
}

function calcIvPercent(att, def, sta) {
  const a = Number(att), d = Number(def), st = Number(sta);
  if ([a, d, st].some((v) => isNaN(v) || v === "")) return null;
  return Math.round(((a + d + st) / 45) * 10000) / 100;
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

function nextMedalTier(tier) {
  return { Nessuno: "Bronzo", Bronzo: "Argento", Argento: "Oro", Oro: "Platino" }[tier] || null;
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
  return { level, currentXp: xp, nextLevelXp, xpInLevel, xpNeeded, progress: xpNeeded > 0 ? xpInLevel / xpNeeded : 0 };
}

function pokedexTotals() {
  let total = 0, caught = 0, seen = 0;
  for (const gen of Object.keys(GEN_TOTALS)) {
    total += GEN_TOTALS[gen];
    caught += state.pokedex[gen].caught;
    seen += state.pokedex[gen].seen;
  }
  return { total, caught, seen, missing: total - caught, caughtPct: total ? caught / total : 0, seenPct: total ? seen / total : 0 };
}

function speciesTotals() {
  let caught = 0, seen = 0, shiny = 0;
  for (const p of POKEMON) {
    const e = state.speciesDex[p.id];
    if (e?.caught) caught++;
    if (e?.seen) seen++;
    if (e?.shiny) shiny++;
  }
  return { total: POKEMON.length, caught, seen, shiny, missing: POKEMON.length - caught };
}

function getGoals(limit = 8) {
  const goals = [];
  for (const m of MEDALS) {
    const progress = state.medals[m.id]?.progress ?? 0;
    const tier = calcMedalTier(progress, m);
    if (tier === "Platino") continue;
    const pct = calcMedalProgress(progress, m);
    goals.push({
      type: "medal", icon: "🏅", title: m.name,
      subtitle: `${fmtPct(pct)} verso ${nextMedalTier(tier)}`,
      pct, link: "medals",
    });
  }
  for (const gen of Object.keys(GEN_TOTALS)) {
    const total = GEN_TOTALS[gen];
    const { caught } = state.pokedex[gen];
    const pct = total ? caught / total : 0;
    if (pct >= 1) continue;
    goals.push({
      type: "dex", icon: "📖", title: `Gen ${gen}`,
      subtitle: `${caught}/${total} catturati (${fmtPct(pct)})`,
      pct, link: "pokedex",
    });
  }
  const xp = calcXpInfo(state.resources.totalXp);
  if (xp.level < MAX_LEVEL) {
    goals.push({
      type: "xp", icon: "⭐", title: `Livello ${xp.level + 1}`,
      subtitle: `Mancano ${fmtNum(xp.xpNeeded - xp.xpInLevel)} XP`,
      pct: xp.progress, link: "resources",
    });
  }
  return goals.sort((a, b) => b.pct - a.pct).slice(0, limit);
}

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

function esc(str) {
  if (!str) return "";
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function importAppData(parsed) {
  if (parsed?.format === "pokemon-go-tracker-excel-sync") {
    importExcelSync(parsed);
    saveApp();
    renderAll();
    return;
  }
  app = parsed?.version >= 3 && parsed.accounts ? parsed : migrateToV3(parsed);
  if (!app.accounts[app.activeAccountId]) app.activeAccountId = Object.keys(app.accounts)[0];
  setActiveState();
  seedHistories();
  saveApp();
  renderAll();
}

function exportAppData() {
  return structuredClone(app);
}
