/* Funzionalità avanzate: raid, PvP, completamento, ricerca globale */

const POKEMON_TYPES = [
  "Normale", "Fuoco", "Acqua", "Elettro", "Erba", "Ghiaccio", "Lotta", "Veleno",
  "Terra", "Volante", "Psico", "Coleottero", "Roccia", "Spettro", "Drago", "Buio", "Acciaio", "Folletto",
];

const PVP_LEAGUES = {
  grande: { label: "Grande", cpCap: 1500 },
  ultra: { label: "Ultra", cpCap: 2500 },
  master: { label: "Master", cpCap: 10000 },
};

const EGG_DISTANCES = [2, 5, 7, 10, 12];

/* Boss raid correnti/rotazione comune con contatori suggeriti */
const RAID_BOSSES = [
  { id: 150, name: "Mewtwo", tier: 5, counters: ["Darkrai", "Giratina", "Yveltal", "Gengar", "Houndoom"] },
  { id: 249, name: "Lugia", tier: 5, counters: ["Zapdos", "Raikou", "Mamoswine", "Electivire", "Magneton"] },
  { id: 250, name: "Ho-Oh", tier: 5, counters: ["Rampardos", "Rhyperior", "Terrakion", "Tyranitar", "Swampert"] },
  { id: 384, name: "Rayquaza", tier: 5, counters: ["Mamoswine", "Glaceon", "Weavile", "Garchomp", "Dialga"] },
  { id: 483, name: "Dialga", tier: 5, counters: ["Lucario", "Terrakion", "Machamp", "Breloom", "Conkeldurr"] },
  { id: 484, name: "Palkia", tier: 5, counters: ["Rayquaza", "Dialga", "Palkia", "Garchomp", "Salamence"] },
  { id: 487, name: "Giratina", tier: 5, counters: ["Rayquaza", "Salamence", "Garchomp", "Dragonite", "Palkia"] },
  { id: 643, name: "Reshiram", tier: 5, counters: ["Rayquaza", "Garchomp", "Salamence", "Dragonite", "Palkia"] },
  { id: 644, name: "Zekrom", tier: 5, counters: ["Rayquaza", "Garchomp", "Salamence", "Dragonite", "Dialga"] },
  { id: 888, name: "Zacian", tier: 5, counters: ["Lucario", "Metagross", "Excadrill", "Conkeldurr", "Terrakion"] },
  { id: 889, name: "Zamazenta", tier: 5, counters: ["Metagross", "Excadrill", "Lucario", "Conkeldurr", "Groudon"] },
  { id: 1007, name: "Koraidon", tier: 5, counters: ["Gardevoir", "Togekiss", "Sylveon", "Clefable", "Granbull"] },
  { id: 1008, name: "Miraidon", tier: 5, counters: ["Garchomp", "Groudon", "Landorus", "Excadrill", "Rhyperior"] },
  { id: 383, name: "Groudon", tier: 5, counters: ["Kyogre", "Swampert", "Gyarados", "Mamoswine", "Kingler"] },
  { id: 382, name: "Kyogre", tier: 5, counters: ["Zekrom", "Raikou", "Magneton", "Electivire", "Voltswitch"] },
];

function calcPvpCp(baseAtk, baseDef, baseSta, ivAtt, ivDef, ivSta, level = 50) {
  return calcCpEstimate(baseAtk, baseDef, baseSta, ivAtt, ivDef, ivSta, level);
}

function calcPvpRank(baseAtk, baseDef, baseSta, ivAtt, ivDef, ivSta, league = "grande") {
  const cap = PVP_LEAGUES[league]?.cpCap ?? 1500;
  let best = null;
  for (let lvl = 50; lvl >= 1; lvl -= 0.5) {
    const cp = calcPvpCp(baseAtk, baseDef, baseSta, ivAtt, ivDef, ivSta, lvl);
    if (cp <= cap) {
      const product = (baseAtk + ivAtt) * Math.sqrt(baseDef + ivDef) * Math.sqrt(baseSta + ivSta);
      best = { level: lvl, cp, product: Math.round(product * 1000) / 1000 };
      break;
    }
  }
  if (!best) return { level: 1, cp: calcPvpCp(baseAtk, baseDef, baseSta, ivAtt, ivDef, ivSta, 1), product: 0, rank: "—" };
  const pct = Math.round(((ivAtt + ivDef + ivSta) / 45) * 10000) / 100;
  return { ...best, ivPct: pct, league: PVP_LEAGUES[league]?.label ?? league };
}

function getCompletionStats(s = state) {
  let dexCaught = 0, dexShiny = 0;
  for (const p of POKEMON) {
    const e = s.speciesDex[p.id];
    if (e?.caught) dexCaught++;
    if (e?.shiny) dexShiny++;
  }
  const dexTotal = POKEMON.length;
  const platinum = MEDALS.filter((m) => calcMedalTier(s.medals[m.id]?.progress ?? 0, m) === "Platino").length;
  const legCaught = s.legendaries.filter((l) => l.caught).length;
  const shinyReg = s.shiny.filter((r) => r.pokemon?.trim()).length;

  const weights = { dex: 0.35, medals: 0.25, legendaries: 0.2, shinyDex: 0.1, shinyReg: 0.1 };
  const scores = {
    dex: dexTotal ? dexCaught / dexTotal : 0,
    medals: MEDALS.length ? platinum / MEDALS.length : 0,
    legendaries: LEGENDARIES.length ? legCaught / LEGENDARIES.length : 0,
    shinyDex: dexTotal ? dexShiny / dexTotal : 0,
    shinyReg: Math.min(1, shinyReg / Math.max(dexShiny, 1)),
  };
  const overall = Object.entries(weights).reduce((sum, [k, w]) => sum + scores[k] * w, 0);

  return {
    overall,
    scores,
    counts: {
      dexCaught, dexTotal,
      platinumMedals: platinum, medalsTotal: MEDALS.length,
      legendariesCaught: legCaught, legendariesTotal: LEGENDARIES.length,
      shinyDex: dexShiny, shinyRegistered: shinyReg,
    },
  };
}

function globalSearch(query, s = state) {
  if (!query?.trim()) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  POKEMON.filter((p) => p.name.toLowerCase().includes(q) || String(p.id).includes(q)).slice(0, 8).forEach((p) => {
    const e = s.speciesDex[p.id] || {};
    results.push({
      type: "pokemon", icon: "📖", title: `#${p.id} ${p.name}`,
      subtitle: e.caught ? "Catturato" : e.seen ? "Visto" : "Mancante",
      section: "pokedex", action: () => openSpeciesModal(p.id),
    });
  });

  MEDALS.filter((m) => m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)).slice(0, 5).forEach((m) => {
    const tier = calcMedalTier(s.medals[m.id]?.progress ?? 0, m);
    results.push({
      type: "medal", icon: "🏅", title: m.name,
      subtitle: `${m.category} · ${tier}`,
      section: "medals", action: () => openMedalModal(m.id),
    });
  });

  s.shiny.filter((r) => r.pokemon?.toLowerCase().includes(q)).slice(0, 5).forEach((r) => {
    results.push({
      type: "shiny", icon: "✨", title: r.pokemon,
      subtitle: r.date || "Senza data",
      section: "shiny",
    });
  });

  s.events.filter((e) => e.name?.toLowerCase().includes(q) || e.pokemon?.toLowerCase().includes(q)).slice(0, 5).forEach((e) => {
    results.push({
      type: "event", icon: "🎉", title: e.name || "Evento",
      subtitle: `${e.type} · ${e.date || "—"}`,
      section: "events",
    });
  });

  s.buddies.filter((b) => b.pokemon?.toLowerCase().includes(q)).slice(0, 3).forEach((b) => {
    results.push({
      type: "buddy", icon: "🐾", title: b.pokemon,
      subtitle: b.active ? "Buddy attivo" : "Buddy",
      section: "buddies",
    });
  });

  return results.slice(0, 15);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date(todayISO());
  return Math.ceil(diff / 86400000);
}

function formatCountdown(days) {
  if (days === null) return "";
  if (days < 0) return `Terminato ${Math.abs(days)} gg fa`;
  if (days === 0) return "Oggi";
  if (days === 1) return "Domani";
  return `Tra ${days} giorni`;
}

function getUpcomingEvents(events = state.events) {
  return [...events]
    .filter((e) => e.date)
    .map((e) => ({ ...e, days: daysUntil(e.endDate || e.date) }))
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

function getRaidBossDetail(bossId) {
  const boss = RAID_BOSSES.find((b) => b.id === bossId);
  if (!boss) return null;
  const p = POKEMON.find((x) => x.id === bossId);
  const counters = boss.counters.map((name) => {
    const c = POKEMON.find((x) => x.name.toLowerCase() === name.toLowerCase()) || { name };
    return c;
  });
  return { ...boss, pokemon: p, counters };
}

function shinyExists(s, name, cp, att, def, sta) {
  const n = name?.toLowerCase();
  return s.shiny.some((r) => {
    if (r.pokemon?.toLowerCase() !== n) return false;
    if (cp && r.cp && String(r.cp) === String(cp)) return true;
    if (att !== "" && def !== "" && sta !== "" &&
      String(r.att) === String(att) && String(r.def) === String(def) && String(r.sta) === String(sta)) return true;
    return false;
  });
}
