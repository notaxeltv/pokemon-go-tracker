/* Sincronizzazione Excel ↔ App */

function exportExcelSync() {
  return {
    format: "pokemon-go-tracker-excel-sync",
    version: 2,
    exportDate: todayISO(),
    accountName: state.name,
    dashboard: { ...state.resources },
    pokedex: state.pokedex,
    speciesDex: state.speciesDex,
    shiny: state.shiny,
    medals: MEDALS.map((m) => ({ id: m.id, name: m.name, progress: state.medals[m.id]?.progress ?? 0 })),
    battles: state.battles,
    rocket: state.rocket,
    mega: state.mega,
    legendaries: state.legendaries,
    events: state.events,
    quests: state.quests,
    buddies: state.buddies,
    showcase: state.showcase,
    globalHistory: state.globalHistory,
    medalHistory: state.medalHistory,
  };
}

function importExcelSync(data) {
  if (data.dashboard) Object.assign(state.resources, data.dashboard);
  if (data.pokedex) {
    for (const g of Object.keys(state.pokedex)) {
      if (data.pokedex[g]) Object.assign(state.pokedex[g], data.pokedex[g]);
    }
  }
  if (data.speciesDex) state.speciesDex = { ...state.speciesDex, ...data.speciesDex };
  if (Array.isArray(data.shiny)) state.shiny = data.shiny;
  if (Array.isArray(data.medals)) {
    data.medals.forEach((m) => {
      if (m.id && state.medals[m.id]) state.medals[m.id].progress = m.progress ?? 0;
    });
  }
  if (data.battles) {
    Object.assign(state.battles.raid, data.battles.raid || {});
    Object.assign(state.battles.gbl, data.battles.gbl || {});
    for (const league of ["grande", "ultra", "master"]) {
      if (data.battles.gbl?.[league]) Object.assign(state.battles.gbl[league], data.battles.gbl[league]);
    }
    Object.assign(state.battles.buddy, data.battles.buddy || {});
  }
  if (data.rocket) {
    Object.assign(state.rocket, data.rocket);
    if (Array.isArray(data.rocket.shadows)) state.rocket.shadows = data.rocket.shadows;
  }
  if (Array.isArray(data.mega)) state.mega = data.mega;
  if (Array.isArray(data.legendaries)) {
    data.legendaries.forEach((leg, i) => {
      if (state.legendaries[i]) Object.assign(state.legendaries[i], leg);
    });
  }
  if (Array.isArray(data.events)) state.events = data.events;
  if (Array.isArray(data.quests)) state.quests = data.quests;
  if (Array.isArray(data.buddies)) state.buddies = data.buddies;
  if (Array.isArray(data.showcase)) state.showcase = data.showcase;
  if (data.globalHistory) state.globalHistory = { ...state.globalHistory, ...data.globalHistory };
  if (data.medalHistory) state.medalHistory = { ...state.medalHistory, ...data.medalHistory };
  if (data.accountName) state.name = data.accountName;
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportData() {
  downloadJson(exportAppData(), `pokemon-go-tracker-${todayISO()}.json`);
}

function exportExcelData() {
  downloadJson(exportExcelSync(), `pokemon-go-tracker-excel-${todayISO()}.json`);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      importAppData(JSON.parse(e.target.result));
      alert("Backup importato con successo!");
    } catch {
      alert("Errore durante l'importazione: file JSON non valido.");
    }
  };
  reader.readAsText(file);
}
