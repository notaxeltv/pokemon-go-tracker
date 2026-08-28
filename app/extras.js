/* Funzioni avanzate: mancanti, collegamenti, calcolatori */

const LEGENDARY_TO_SPECIES = {
  Articuno: null, Zapdos: null, Moltres: null, Mewtwo: 150,
  Raikou: 243, Entei: 244, Suicune: 245, Lugia: 249, "Ho-Oh": 250,
  Regirock: 377, Regice: 378, Registeel: 379, Latias: 380, Latios: 381,
  Kyogre: 382, Groudon: 383, Rayquaza: 384, Uxie: 480, Mesprit: 481, Azelf: 482,
  Dialga: 483, Palkia: 484, Heatran: 485, Regigigas: 486, Giratina: 487, Cresselia: 488,
  Cobalion: 638, Terrakion: 639, Virizion: 640, Tornadus: 641, Thundurus: 642,
  Reshiram: 643, Zekrom: 644, Landorus: 645, Kyurem: 646,
  Xerneas: 716, Yveltal: 717, Zygarde: 718,
  "Tapu Koko": 785, "Tapu Lele": 786, "Tapu Bulu": 787, "Tapu Fini": 788,
  Solgaleo: 791, Lunala: 792, Necrozma: 800,
  Zacian: 888, Zamazenta: 889, Eternatus: 890,
  Regieleki: 894, Regidrago: 895, Glastrier: 896, Spectrier: 897, Calyrex: 898,
  Koraidon: 1007, Miraidon: 1008,
};

function findPokemonByName(name) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return POKEMON.find((p) => p.name.toLowerCase() === n) || POKEMON.find((p) => n.includes(p.name.toLowerCase()));
}

function linkSpeciesCaught(speciesId, s = state) {
  const entry = getSpeciesEntry(speciesId);
  entry.caught = true;
  entry.seen = true;
  syncGenFromSpecies(s);
}

function linkSpeciesShiny(speciesId, pokemonName, s = state) {
  const entry = getSpeciesEntry(speciesId);
  entry.shiny = true;
  entry.caught = true;
  entry.seen = true;
  const p = POKEMON.find((x) => x.id === speciesId);
  const name = pokemonName || p?.name || "";
  if (name && !s.shiny.some((r) => r.pokemon?.toLowerCase() === name.toLowerCase())) {
    s.shiny.push({ date: todayISO(), pokemon: name, cp: "", att: "", def: "", sta: "", method: "Auto-link", notes: "" });
  }
  syncGenFromSpecies(s);
}

function linkLegendaryCaught(legendaryName, shiny = false, s = state) {
  const speciesId = LEGENDARY_TO_SPECIES[legendaryName];
  if (speciesId) linkSpeciesCaught(speciesId, s);
  if (shiny && speciesId) linkSpeciesShiny(speciesId, legendaryName, s);
}

function getMissingDex(limit = 50) {
  return POKEMON.filter((p) => !state.speciesDex[p.id]?.caught).slice(0, limit);
}

function getMissingShinyDex(limit = 50) {
  return POKEMON.filter((p) => !state.speciesDex[p.id]?.shiny).slice(0, limit);
}

function getMissingLegendaryShiny() {
  return state.legendaries.filter((l) => !l.shiny);
}

function getMedalsNearPlatinum(limit = 10) {
  return MEDALS.map((m) => {
    const progress = state.medals[m.id]?.progress ?? 0;
    const tier = calcMedalTier(progress, m);
    if (tier === "Platino") return null;
    return { medal: m, progress, tier, pct: calcMedalProgress(progress, m) };
  }).filter(Boolean).sort((a, b) => b.pct - a.pct).slice(0, limit);
}

function estimateDaysToLevel() {
  const hist = state.globalHistory.xp;
  if (hist.length < 2) return null;
  const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = Math.max(1, (new Date(last.date) - new Date(first.date)) / 86400000);
  const xpPerDay = (last.value - first.value) / days;
  if (xpPerDay <= 0) return null;
  const xp = calcXpInfo(state.resources.totalXp);
  if (xp.level >= MAX_LEVEL) return { days: 0, xpPerDay, message: "Livello massimo" };
  const needed = xp.xpNeeded - xp.xpInLevel;
  return { days: Math.ceil(needed / xpPerDay), xpPerDay: Math.round(xpPerDay), needed };
}

function calcCpEstimate(baseAtk, baseDef, baseSta, ivAtt, ivDef, ivSta, level = 40) {
  const cpm = [0.094, 0.16639787, 0.21573247, 0.25572005, 0.29024988, 0.34657189, 0.37523559, 0.39956728, 0.42250000, 0.44310755, 0.46239839, 0.48168495, 0.50052071, 0.51909989, 0.53779994, 0.56649673, 0.58536585, 0.60420375, 0.62291618, 0.64117895, 0.65978037, 0.67803444, 0.69591216, 0.71316496, 0.73071242, 0.73776948, 0.75536601, 0.77260011, 0.78949678, 0.80599541, 0.82213246, 0.83790797, 0.85331111, 0.86834096, 0.88299732, 0.89728077, 0.91119323, 0.92473775, 0.93788895, 0.95065576, 0.96304256];
  const idx = Math.min(Math.max(Math.round(level * 2) - 1, 0), cpm.length - 1);
  const mult = cpm[idx];
  const atk = (baseAtk + ivAtt) * mult;
  const def = (baseDef + ivDef) * mult;
  const sta = (baseSta + ivSta) * mult;
  return Math.max(10, Math.floor(atk * Math.sqrt(def) * Math.sqrt(sta) / 10));
}

function getRaidCounters(speciesId, limit = 6) {
  const p = POKEMON.find((x) => x.id === speciesId);
  if (!p?.weaknesses) return [];
  const types = [...(p.weaknesses.doubleWeak || []), ...(p.weaknesses.weak || [])];
  return types.slice(0, limit);
}

function getAccountSnapshot(acc) {
  const dex = { total: 0, caught: 0 };
  for (const g of Object.keys(GEN_TOTALS)) {
    dex.total += GEN_TOTALS[g];
    dex.caught += acc.pokedex[g]?.caught ?? 0;
  }
  const platinum = MEDALS.filter((m) => calcMedalTier(acc.medals[m.id]?.progress ?? 0, m) === "Platino").length;
  const shiny = acc.shiny?.filter((s) => s.pokemon?.trim()).length ?? 0;
  const leg = acc.legendaries?.filter((l) => l.caught).length ?? 0;
  return {
    name: acc.name,
    level: calcXpInfo(acc.resources?.totalXp ?? 0).level,
    dexPct: dex.total ? dex.caught / dex.total : 0,
    platinumMedals: platinum,
    shiny,
    legendaries: leg,
    stardust: acc.resources?.stardust ?? 0,
  };
}

function compareAccounts(idA, idB) {
  const a = app.accounts[idA];
  const b = app.accounts[idB];
  if (!a || !b) return null;
  const sa = getAccountSnapshot(a);
  const sb = getAccountSnapshot(b);
  return [
    { label: "Livello", a: sa.level, b: sb.level },
    { label: "% Pokédex", a: fmtPct(sa.dexPct), b: fmtPct(sb.dexPct) },
    { label: "Medaglie Platino", a: sa.platinumMedals, b: sb.platinumMedals },
    { label: "Shiny", a: sa.shiny, b: sb.shiny },
    { label: "Leggendari", a: sa.legendaries, b: sb.legendaries },
    { label: "Stardust", a: fmtNum(sa.stardust), b: fmtNum(sb.stardust) },
  ];
}

function needsBackupReminder() {
  const last = app.settings.lastBackupDate;
  if (!last) return true;
  const days = (Date.now() - new Date(last).getTime()) / 86400000;
  return days >= 30 && !app.settings.backupReminderDismissed;
}

function markBackupDone() {
  app.settings.lastBackupDate = todayISO();
  app.settings.backupReminderDismissed = false;
  saveApp();
}
