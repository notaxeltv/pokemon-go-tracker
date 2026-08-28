/* Pokémon GO Tracker — UI e rendering */

let medalFilter = "all";
let medalSearch = "";
let medalSort = "name";
let speciesGenFilter = "all";
let speciesTypeFilter = "all";
let speciesStatusFilter = "all";
let speciesSearch = "";
let speciesShowLimit = 60;
let eventsView = "list";
let activeMedalId = null;
let chartPeriod = "days";
let dashChartMetric = "xp";
let dashChartPeriod = "days";
let pokedexTab = "gens";

const MEDAL_CATEGORIES = ["all", ...new Set(MEDALS.map((m) => m.category))];

function renderAll() {
  renderAccountBar();
  renderBanners();
  renderDashboard();
  renderHunters();
  renderPokedex();
  renderSpeciesDex();
  renderShiny();
  renderResources();
  renderMedals();
  renderBattles();
  renderRaidBosses();
  renderRocket();
  renderMega();
  renderBuddies();
  renderEggs();
  renderEvents();
  renderBreakthrough();
  renderQuests();
  renderShowcase();
  renderLegendaries();
}

function renderAccountBar() {
  const sel = document.getElementById("account-select");
  const nameInput = document.getElementById("account-name");
  if (!sel) return;
  sel.innerHTML = Object.entries(app.accounts)
    .map(([id, acc]) => `<option value="${id}"${id === app.activeAccountId ? " selected" : ""}>${esc(acc.name)}</option>`)
    .join("");
  if (nameInput) nameInput.value = state.name || "";
  const themeBtn = document.getElementById("btn-theme");
  if (themeBtn) themeBtn.textContent = app.settings.theme === "light" ? "🌙 Scuro" : "☀️ Chiaro";
}

function renderDashboard() {
  const dex = pokedexTotals();
  const sp = speciesTotals();
  const xpInfo = calcXpInfo(state.resources.totalXp);
  const raidWr = calcWinRate(state.battles.raid.wins, state.battles.raid.losses);
  const gblWr = calcWinRate(state.battles.gbl.wins, state.battles.gbl.losses);
  const shinyCount = state.shiny.filter((s) => s.pokemon?.trim()).length;
  const legCaught = state.legendaries.filter((l) => l.caught).length;
  const legShiny = state.legendaries.filter((l) => l.shiny).length;
  const platinumMedals = MEDALS.filter((m) => calcMedalTier(state.medals[m.id]?.progress ?? 0, m) === "Platino").length;

  const cards = [
    { label: "Stardust", value: fmtNum(state.resources.stardust) },
    { label: "Polvere Lucente", value: fmtNum(state.resources.stardustPowder) },
    { label: "Livello", value: xpInfo.level, accent: true },
    { label: "XP Totale", value: fmtNum(state.resources.totalXp) },
    { label: "Pokédex Catturati", value: `${dex.caught} / ${dex.total}`, success: true },
    { label: "Specie Catturate", value: `${sp.caught} / ${sp.total}`, success: true },
    { label: "% Pokédex", value: fmtPct(dex.caughtPct), success: true },
    { label: "Shiny Registrati", value: shinyCount, warning: true },
    { label: "Raid Win Rate", value: fmtPct(raidWr) },
    { label: "GBL Win Rate", value: fmtPct(gblWr) },
    { label: "Leggendari", value: `${legCaught} / ${LEGENDARIES.length}`, accent: true },
    { label: "Medaglie Platino", value: `${platinumMedals} / ${MEDALS.length}`, success: true },
  ];

  document.getElementById("dashboard-cards").innerHTML = cards.map((c) => `
    <div class="card"><div class="card-label">${c.label}</div>
    <div class="card-value${c.accent ? " accent" : ""}${c.success ? " success" : ""}${c.warning ? " warning" : ""}">${c.value}</div></div>`).join("");

  const comp = getCompletionStats();
  const compEl = document.getElementById("dashboard-completion");
  if (compEl) {
    compEl.innerHTML = `
      <h3>🏁 Completamento globale: ${fmtPct(comp.overall)}</h3>
      <div class="completion-bars">
        <div class="completion-row"><span>Pokédex</span><div class="goal-bar-wrap"><div class="goal-bar" style="width:${(comp.scores.dex * 100).toFixed(0)}%"></div></div><span>${comp.counts.dexCaught}/${comp.counts.dexTotal}</span></div>
        <div class="completion-row"><span>Medaglie Platino</span><div class="goal-bar-wrap"><div class="goal-bar" style="width:${(comp.scores.medals * 100).toFixed(0)}%"></div></div><span>${comp.counts.platinumMedals}/${comp.counts.medalsTotal}</span></div>
        <div class="completion-row"><span>Leggendari</span><div class="goal-bar-wrap"><div class="goal-bar" style="width:${(comp.scores.legendaries * 100).toFixed(0)}%"></div></div><span>${comp.counts.legendariesCaught}/${comp.counts.legendariesTotal}</span></div>
        <div class="completion-row"><span>Shiny dex</span><div class="goal-bar-wrap"><div class="goal-bar" style="width:${(comp.scores.shinyDex * 100).toFixed(0)}%"></div></div><span>${comp.counts.shinyDex}</span></div>
      </div>`;
  }

  const goals = getGoals(8);
  document.getElementById("dashboard-goals").innerHTML = goals.length
    ? goals.map((g) => `
      <div class="goal-item" data-section="${g.link}">
        <span class="goal-icon">${g.icon}</span>
        <div><div class="goal-title">${esc(g.title)}</div><div class="goal-sub">${esc(g.subtitle)}</div></div>
        <div class="goal-bar-wrap"><div class="goal-bar" style="width:${Math.min(100, g.pct * 100).toFixed(0)}%"></div></div>
      </div>`).join("")
    : '<p class="empty-msg">Nessun obiettivo in corso.</p>';

  document.querySelectorAll(".goal-item").forEach((el) => {
    el.addEventListener("click", () => {
      document.querySelector(`.nav-btn[data-section="${el.dataset.section}"]`)?.click();
    });
  });

  document.querySelectorAll(".dash-chart-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.metric === dashChartMetric);
  });
  document.querySelectorAll(".dash-period-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.period === dashChartPeriod);
  });

  const metricLabels = { xp: "XP Totale", stardust: "Stardust", pokedexPct: "% Pokédex", raidWins: "Raid vinti" };
  const history = state.globalHistory[dashChartMetric] || [];
  const data = aggregateHistory(history, dashChartPeriod);
  drawLineChart(document.getElementById("dash-chart"), data, {
    period: dashChartPeriod,
    emptyEl: document.getElementById("dash-chart-empty"),
    color: "#4caf82",
    valueLabel: metricLabels[dashChartMetric],
    formatValue: dashChartMetric === "pokedexPct" ? (v) => `${v.toFixed(1)}%` : (v) => fmtNum(Math.round(v)),
    legendEl: document.getElementById("dash-chart-legend"),
  });

  const etaEl = document.getElementById("dashboard-eta");
  if (etaEl) {
    const eta = estimateDaysToLevel();
    if (eta?.message) etaEl.textContent = eta.message;
    else if (eta) {
      etaEl.textContent = `Stima livello successivo: ~${eta.days} giorni (${fmtNum(eta.xpPerDay)} XP/giorno, mancano ${fmtNum(eta.needed)} XP)`;
    } else etaEl.textContent = "";
  }
}

function renderBanners() {
  const ios = document.getElementById("ios-hint");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
  if (ios) {
    if (isIOS && !isStandalone && !app.settings.iosHintShown) {
      ios.classList.remove("hidden");
      ios.innerHTML = `📱 <strong>Installa su iPhone:</strong> Safari → Condividi → Aggiungi a Home.
        <button type="button" id="btn-dismiss-ios" class="btn btn-secondary btn-sm">OK</button>`;
      document.getElementById("btn-dismiss-ios")?.addEventListener("click", () => {
        app.settings.iosHintShown = true;
        saveApp();
        ios.classList.add("hidden");
      });
    } else ios.classList.add("hidden");
  }

  const backup = document.getElementById("backup-banner");
  if (backup) {
    if (needsBackupReminder()) {
      backup.classList.remove("hidden");
      backup.innerHTML = `⚠️ Nessun backup da oltre 30 giorni.
        <button type="button" id="btn-backup-now" class="btn btn-primary btn-sm">Esporta ora</button>
        <button type="button" id="btn-dismiss-backup" class="btn btn-secondary btn-sm">Più tardi</button>`;
      document.getElementById("btn-backup-now")?.addEventListener("click", () => exportDataWithBackupMark());
      document.getElementById("btn-dismiss-backup")?.addEventListener("click", () => {
        app.settings.backupReminderDismissed = true;
        saveApp();
        backup.classList.add("hidden");
      });
    } else backup.classList.add("hidden");
  }
}

function renderHunters() {
  const grid = document.getElementById("hunters-grid");
  if (!grid) return;
  const missingDex = getMissingDex(30);
  const missingShiny = getMissingShinyDex(30);
  const missingLegShiny = getMissingLegendaryShiny();
  const nearPlat = getMedalsNearPlatinum(8);
  const sp = speciesTotals();

  grid.innerHTML = `
    <div class="panel">
      <h3>📖 Pokédex mancanti <span class="badge">${sp.missing}</span></h3>
      <ul class="hunter-list">${missingDex.map((p) => `<li>#${p.id} ${esc(p.name)}</li>`).join("") || "<li class='empty-msg'>Completato!</li>"}</ul>
    </div>
    <div class="panel">
      <h3>✨ Shiny mancanti <span class="badge">${sp.total - sp.shiny}</span></h3>
      <ul class="hunter-list">${missingShiny.map((p) => `<li>#${p.id} ${esc(p.name)}</li>`).join("") || "<li class='empty-msg'>Completato!</li>"}</ul>
    </div>
    <div class="panel">
      <h3>🌟 Leggendari shiny mancanti <span class="badge">${missingLegShiny.length}</span></h3>
      <ul class="hunter-list">${missingLegShiny.map((l) => `<li>${esc(l.name)}</li>`).join("") || "<li class='empty-msg'>Completato!</li>"}</ul>
    </div>
    <div class="panel">
      <h3>🏅 Vicine al Platino</h3>
      <ul class="hunter-list">${nearPlat.map(({ medal, tier, pct }) =>
        `<li><button type="button" class="hunter-medal-link" data-id="${medal.id}">${esc(medal.name)}</button> — ${tier} (${fmtPct(pct)})</li>`
      ).join("") || "<li class='empty-msg'>Nessuna in corso.</li>"}</ul>
    </div>`;

  grid.querySelectorAll(".hunter-medal-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector('.nav-btn[data-section="medals"]')?.click();
      openMedalModal(btn.dataset.id);
    });
  });
}

function renderPokedex() {
  document.querySelectorAll(".pokedex-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === pokedexTab);
  });
  document.getElementById("pokedex-gens-panel").classList.toggle("hidden", pokedexTab !== "gens");
  document.getElementById("pokedex-species-panel").classList.toggle("hidden", pokedexTab !== "species");

  const body = document.getElementById("pokedex-body");
  body.innerHTML = Object.keys(GEN_TOTALS).map((gen) => {
    const total = GEN_TOTALS[gen];
    const { caught, seen } = state.pokedex[gen];
    return `<tr>
      <td>Gen ${gen}</td><td>${total}</td>
      <td><input type="number" class="table-input" min="0" max="${total}" value="${caught}" data-gen="${gen}" data-field="caught"></td>
      <td><input type="number" class="table-input" min="0" max="${total}" value="${seen}" data-gen="${gen}" data-field="seen"></td>
      <td class="computed">${total - caught}</td>
      <td class="computed">${fmtPct(total ? caught / total : 0)}</td>
      <td class="computed">${fmtPct(total ? seen / total : 0)}</td>
    </tr>`;
  }).join("");

  const dex = pokedexTotals();
  document.getElementById("pokedex-foot").innerHTML = `<tr>
    <td>TOTALE</td><td>${dex.total}</td><td>${dex.caught}</td><td>${dex.seen}</td>
    <td class="computed">${dex.missing}</td><td class="computed">${fmtPct(dex.caughtPct)}</td><td class="computed">${fmtPct(dex.seenPct)}</td></tr>`;

  body.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      const gen = input.dataset.gen;
      const field = input.dataset.field;
      updateState((s) => { s.pokedex[gen][field] = Math.max(0, parseInt(input.value, 10) || 0); });
    });
  });
}

function renderSpeciesDex() {
  const toolbar = document.getElementById("species-toolbar");
  if (!toolbar) return;

  const gens = ["all", ...Array.from({ length: 9 }, (_, i) => String(i + 1))];
  const typeOpts = ["all", ...POKEMON_TYPES];
  toolbar.innerHTML = `
    <input type="search" id="species-search" class="search-input" placeholder="Cerca Pokémon..." value="${esc(speciesSearch)}">
    <select id="species-gen-filter" class="select-input">${gens.map((g) => `<option value="${g}"${speciesGenFilter === g ? " selected" : ""}>${g === "all" ? "Tutte le gen" : "Gen " + g}</option>`).join("")}</select>
    <select id="species-type-filter" class="select-input">${typeOpts.map((t) => `<option value="${t}"${speciesTypeFilter === t ? " selected" : ""}>${t === "all" ? "Tutti i tipi" : t}</option>`).join("")}</select>
    <select id="species-status-filter" class="select-input">
      <option value="all"${speciesStatusFilter === "all" ? " selected" : ""}>Tutti</option>
      <option value="missing"${speciesStatusFilter === "missing" ? " selected" : ""}>Mancanti</option>
      <option value="seen"${speciesStatusFilter === "seen" ? " selected" : ""}>Visti</option>
      <option value="caught"${speciesStatusFilter === "caught" ? " selected" : ""}>Catturati</option>
      <option value="shiny"${speciesStatusFilter === "shiny" ? " selected" : ""}>Shiny</option>
    </select>`;

  document.getElementById("species-search").addEventListener("input", (e) => { speciesSearch = e.target.value.toLowerCase(); speciesShowLimit = 60; renderSpeciesDex(); });
  document.getElementById("species-gen-filter").addEventListener("change", (e) => { speciesGenFilter = e.target.value; speciesShowLimit = 60; renderSpeciesDex(); });
  document.getElementById("species-type-filter").addEventListener("change", (e) => { speciesTypeFilter = e.target.value; speciesShowLimit = 60; renderSpeciesDex(); });
  document.getElementById("species-status-filter").addEventListener("change", (e) => { speciesStatusFilter = e.target.value; speciesShowLimit = 60; renderSpeciesDex(); });

  let list = POKEMON.filter((p) => {
    if (speciesGenFilter !== "all" && p.gen !== Number(speciesGenFilter)) return false;
    if (speciesTypeFilter !== "all" && !(p.types || []).includes(speciesTypeFilter)) return false;
    if (speciesSearch && !p.name.toLowerCase().includes(speciesSearch) && !String(p.id).includes(speciesSearch)) return false;
    const e = state.speciesDex[p.id] || {};
    if (speciesStatusFilter === "missing" && e.caught) return false;
    if (speciesStatusFilter === "seen" && !e.seen) return false;
    if (speciesStatusFilter === "caught" && !e.caught) return false;
    if (speciesStatusFilter === "shiny" && !e.shiny) return false;
    return true;
  });

  const sp = speciesTotals();
  document.getElementById("species-summary").textContent =
    `${sp.caught}/${sp.total} catturati · ${sp.shiny} shiny · ${list.length} mostrati`;

  const grid = document.getElementById("species-grid");
  const shown = list.slice(0, speciesShowLimit);
  grid.innerHTML = shown.map((p) => {
    const e = state.speciesDex[p.id] || { caught: false, seen: false, shiny: false };
    const cls = e.caught ? "caught" : e.seen ? "seen" : "";
    return `<div class="species-card ${cls}" data-id="${p.id}">
      <button type="button" class="species-info-btn" data-id="${p.id}" title="Dettagli ottenimento/evoluzione">
        <div class="species-num">#${String(p.id).padStart(4, "0")}</div>
        <div class="species-name">${esc(p.name)}</div>
      </button>
      <div class="species-actions">
        <label title="Visto"><input type="checkbox" data-id="${p.id}" data-field="seen"${e.seen ? " checked" : ""}> 👁</label>
        <label title="Catturato"><input type="checkbox" data-id="${p.id}" data-field="caught"${e.caught ? " checked" : ""}> ✓</label>
        <label title="Shiny"><input type="checkbox" data-id="${p.id}" data-field="shiny"${e.shiny ? " checked" : ""}> ✨</label>
      </div>
    </div>`;
  }).join("") + (list.length > speciesShowLimit
    ? `<button type="button" id="species-load-more" class="btn btn-secondary species-load-more">Mostra altri (${list.length - speciesShowLimit} rimanenti)</button>`
    : "");

  document.getElementById("species-load-more")?.addEventListener("click", () => {
    speciesShowLimit += 60;
    renderSpeciesDex();
  });

  grid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (ev) => {
      ev.stopPropagation();
      const id = Number(input.dataset.id);
      const field = input.dataset.field;
      updateState((s) => {
        const entry = getSpeciesEntry(id);
        entry[field] = input.checked;
        if (field === "caught" && input.checked) {
          entry.seen = true;
          linkSpeciesCaught(id, s);
        }
        if (field === "seen" && input.checked) entry.seen = true;
        if (field === "shiny" && input.checked) {
          const p = POKEMON.find((x) => x.id === id);
          if (p) linkSpeciesShiny(id, p.name, s);
        }
      }, { syncGen: true });
    });
  });

  grid.querySelectorAll(".species-info-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSpeciesModal(Number(btn.dataset.id)));
  });
}

function renderShiny() {
  const body = document.getElementById("shiny-body");
  if (state.shiny.length === 0) {
    body.innerHTML = `<tr><td colspan="10" class="empty-msg">Nessuno shiny registrato.</td></tr>`;
    return;
  }
  body.innerHTML = state.shiny.map((row, i) => {
    const iv = calcIvPercent(row.att, row.def, row.sta);
    return `<tr data-idx="${i}">
      <td><input type="date" class="table-input" value="${row.date || ""}" data-field="date"></td>
      <td><input type="text" class="table-input" value="${esc(row.pokemon)}" data-field="pokemon"></td>
      <td><input type="number" class="table-input" min="0" value="${row.cp ?? ""}" data-field="cp"></td>
      <td><input type="number" class="table-input" min="0" max="15" value="${row.att ?? ""}" data-field="att"></td>
      <td><input type="number" class="table-input" min="0" max="15" value="${row.def ?? ""}" data-field="def"></td>
      <td><input type="number" class="table-input" min="0" max="15" value="${row.sta ?? ""}" data-field="sta"></td>
      <td class="computed">${iv !== null ? iv + "%" : "—"}</td>
      <td><input type="text" class="table-input" value="${esc(row.method)}" data-field="method"></td>
      <td><input type="text" class="table-input" value="${esc(row.notes)}" data-field="notes"></td>
      <td><button class="btn btn-danger btn-del-shiny" data-idx="${i}">✕</button></td>
    </tr>`;
  }).join("");

  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    s.shiny[idx][field] = ["cp", "att", "def", "sta"].includes(field) ? (val === "" ? "" : Number(val)) : val;
  }));
  body.querySelectorAll(".btn-del-shiny").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.shiny.splice(parseInt(btn.dataset.idx, 10), 1); }));
  });
}

function renderResources() {
  const r = state.resources;
  const fields = [
    { key: "stardust", label: "Stardust" }, { key: "stardustPowder", label: "Polvere Lucente" },
    { key: "pokeballs", label: "Poké Ball" }, { key: "megaEnergy", label: "Mega Energy" }, { key: "totalXp", label: "XP Totale" },
  ];
  document.getElementById("resources-form").innerHTML = fields.map((f) => `
    <div class="form-field"><label>${f.label}</label><input type="number" min="0" id="res-${f.key}" value="${r[f.key]}"></div>`).join("");
  fields.forEach((f) => {
    document.getElementById(`res-${f.key}`).addEventListener("change", (e) => {
      updateState((s) => { s.resources[f.key] = Math.max(0, parseInt(e.target.value, 10) || 0); });
    });
  });

  const invFields = [
    { key: "greatBalls", label: "Mega Ball" }, { key: "ultraBalls", label: "Ultra Ball" },
    { key: "xlCandy", label: "Caramelle XL" }, { key: "sunStone", label: "Pietra Sole" },
    { key: "sinnohStone", label: "Pietra Sinnoh" }, { key: "unovaStone", label: "Pietra Unima" },
    { key: "lureModules", label: "Esca moduli" }, { key: "incubators", label: "Incubatrici" },
    { key: "eliteFastTm", label: "Elite TM Fast" }, { key: "eliteChargedTm", label: "Elite TM Charged" },
  ];
  const invForm = document.getElementById("inventory-form");
  if (invForm) {
    invForm.innerHTML = `<h3 class="form-section-title">Inventario</h3>` + invFields.map((f) => `
      <div class="form-field"><label>${f.label}</label><input type="number" min="0" id="inv-${f.key}" value="${r[f.key] ?? 0}"></div>`
    ).join("");
    invFields.forEach((f) => {
      document.getElementById(`inv-${f.key}`).addEventListener("change", (e) => {
        updateState((s) => { s.resources[f.key] = Math.max(0, parseInt(e.target.value, 10) || 0); });
      });
    });
  }

  const tmPanel = document.getElementById("elite-tm-panel");
  if (tmPanel) {
    const usage = state.eliteTms?.usage || [];
    tmPanel.innerHTML = `<h3>Elite TM — utilizzo</h3>${
      usage.length
        ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Pokémon</th><th>Mossa</th><th>Tipo</th><th></th></tr></thead><tbody id="etm-body">${
          usage.map((u, i) => `<tr data-idx="${i}">
            <td><input type="date" class="table-input" value="${u.date || ""}" data-field="date"></td>
            <td><input type="text" class="table-input" value="${esc(u.pokemon)}" data-field="pokemon"></td>
            <td><input type="text" class="table-input" value="${esc(u.move)}" data-field="move"></td>
            <td><select data-field="tmType"><option value="fast"${u.tmType === "fast" ? " selected" : ""}>Fast</option><option value="charged"${u.tmType !== "fast" ? " selected" : ""}>Charged</option></select></td>
            <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
          </tr>`).join("")
        }</tbody></table></div>`
        : "<p class='empty-msg'>Nessun Elite TM usato.</p>"
    }<button type="button" id="btn-add-etm" class="btn btn-primary">+ Registra utilizzo</button>`;
    document.getElementById("btn-add-etm")?.addEventListener("click", () => {
      updateState((s) => {
        if (!s.eliteTms) s.eliteTms = { usage: [] };
        s.eliteTms.usage.push({ date: todayISO(), pokemon: "", move: "", tmType: "charged" });
      });
    });
    const etmBody = document.getElementById("etm-body");
    if (etmBody) {
      bindTableInputs(etmBody, (idx, field, val) => updateState((s) => { s.eliteTms.usage[idx][field] = val; }));
      etmBody.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", () => updateState((s) => { s.eliteTms.usage.splice(parseInt(btn.dataset.del, 10), 1); }));
      });
    }
  }

  const xp = calcXpInfo(r.totalXp);
  document.getElementById("xp-progress").innerHTML = `
    <h3>Livello ${xp.level}${xp.level >= MAX_LEVEL ? " (MAX)" : ` → ${xp.level + 1}`}</h3>
    <div class="progress-bar-wrap"><div class="progress-bar" style="width:${(xp.progress * 100).toFixed(1)}%"></div></div>
    <div class="xp-stats">
      <span>XP attuale: ${fmtNum(xp.currentXp)}</span>
      ${xp.level < MAX_LEVEL ? `<span>Mancano ${fmtNum(xp.xpNeeded - xp.xpInLevel)} XP al livello ${xp.level + 1}</span>` : "<span>Livello massimo!</span>"}
    </div>`;
}

function renderMedals() {
  const toolbar = document.getElementById("medals-toolbar");
  toolbar.innerHTML = `
    <input type="search" id="medal-search" class="search-input" placeholder="Cerca medaglia..." value="${esc(medalSearch)}">
    <select id="medal-sort" class="select-input">
      <option value="name"${medalSort === "name" ? " selected" : ""}>Nome A-Z</option>
      <option value="progress-desc"${medalSort === "progress-desc" ? " selected" : ""}>% prossimo ↓</option>
      <option value="progress-asc"${medalSort === "progress-asc" ? " selected" : ""}>% prossimo ↑</option>
      <option value="tier"${medalSort === "tier" ? " selected" : ""}>Tier</option>
    </select>
    ${MEDAL_CATEGORIES.map((cat) => {
      const label = cat === "all" ? "Tutte" : cat;
      const count = cat === "all" ? MEDALS.length : MEDALS.filter((m) => m.category === cat).length;
      return `<button class="medal-filter-btn${medalFilter === cat ? " active" : ""}" data-cat="${cat}">${label} (${count})</button>`;
    }).join("")}`;

  document.getElementById("medal-search").addEventListener("input", (e) => { medalSearch = e.target.value.toLowerCase(); renderMedals(); });
  document.getElementById("medal-sort").addEventListener("change", (e) => { medalSort = e.target.value; renderMedals(); });
  toolbar.querySelectorAll(".medal-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => { medalFilter = btn.dataset.cat; renderMedals(); });
  });

  const tierOrder = { Platino: 4, Oro: 3, Argento: 2, Bronzo: 1, Nessuno: 0 };
  let filtered = MEDALS.filter((m) => {
    if (medalFilter !== "all" && m.category !== medalFilter) return false;
    if (medalSearch && !m.name.toLowerCase().includes(medalSearch) && !m.desc.toLowerCase().includes(medalSearch)) return false;
    return true;
  });
  filtered = filtered.sort((a, b) => {
    const pa = state.medals[a.id]?.progress ?? 0;
    const pb = state.medals[b.id]?.progress ?? 0;
    if (medalSort === "name") return a.name.localeCompare(b.name, "it");
    if (medalSort === "progress-desc") return calcMedalProgress(pb, b) - calcMedalProgress(pa, a);
    if (medalSort === "progress-asc") return calcMedalProgress(pa, a) - calcMedalProgress(pb, b);
    if (medalSort === "tier") return tierOrder[calcMedalTier(pb, b)] - tierOrder[calcMedalTier(pa, a)];
    return 0;
  });

  document.getElementById("medals-body").innerHTML = filtered.map((m) => {
    const progress = state.medals[m.id]?.progress ?? 0;
    const tier = calcMedalTier(progress, m);
    const pct = calcMedalProgress(progress, m);
    return `<tr>
      <td><button type="button" class="medal-link" data-id="${m.id}">${esc(m.name)}</button></td>
      <td><span class="category-tag">${m.category}</span></td>
      <td class="desc-col">${esc(m.desc)}</td>
      <td><input type="number" class="table-input" min="0" step="any" value="${progress}" data-id="${m.id}"></td>
      <td>${fmtNum(m.bronze)}</td><td>${fmtNum(m.silver)}</td><td>${fmtNum(m.gold)}</td><td>${fmtNum(m.platinum)}</td>
      <td class="computed ${tierClass(tier)}">${tier}</td>
      <td class="computed">${tier === "Platino" ? "100%" : fmtPct(pct)}</td>
    </tr>`;
  }).join("");

  document.querySelectorAll("#medals-body input").forEach((input) => {
    input.addEventListener("change", () => {
      const id = input.dataset.id;
      const val = Math.max(0, parseFloat(input.value) || 0);
      updateState((s) => { s.medals[id].progress = val; recordMedalHistory(id, val); });
    });
  });
  document.querySelectorAll(".medal-link").forEach((btn) => {
    btn.addEventListener("click", () => openMedalModal(btn.dataset.id));
  });
}

function renderBattles() {
  const b = state.battles;
  const raidWr = calcWinRate(b.raid.wins, b.raid.losses);
  const gblWr = calcWinRate(b.gbl.wins, b.gbl.losses);
  const candiesKm = b.buddy.km > 0 ? (b.buddy.candies / b.buddy.km).toFixed(2) : "0";
  document.getElementById("battles-grid").innerHTML = `
    <div class="battle-card"><h3>⚔️ Raid</h3>
      <div class="battle-field"><label>Vittorie</label><input type="number" min="0" id="raid-wins" value="${b.raid.wins}"></div>
      <div class="battle-field"><label>Sconfitte</label><input type="number" min="0" id="raid-losses" value="${b.raid.losses}"></div>
      <div class="battle-result"><span class="label">Win Rate</span><span class="value">${fmtPct(raidWr)}</span></div></div>
    <div class="battle-card"><h3>🏆 GBL</h3>
      <div class="battle-field"><label>Vittorie</label><input type="number" min="0" id="gbl-wins" value="${b.gbl.wins}"></div>
      <div class="battle-field"><label>Sconfitte</label><input type="number" min="0" id="gbl-losses" value="${b.gbl.losses}"></div>
      <div class="battle-result"><span class="label">Win Rate</span><span class="value">${fmtPct(gblWr)}</span></div></div>
    <div class="battle-card"><h3>🐾 Buddy (totali)</h3>
      <div class="battle-field"><label>Km</label><input type="number" min="0" step="0.1" id="buddy-km" value="${b.buddy.km}"></div>
      <div class="battle-field"><label>Caramelle</label><input type="number" min="0" id="buddy-candies" value="${b.buddy.candies}"></div>
      <div class="battle-field"><label>Cuori</label><input type="number" min="0" id="buddy-hearts" value="${b.buddy.hearts}"></div>
      <div class="battle-result"><span class="label">Caramelle/Km</span><span class="value">${candiesKm}</span></div></div>`;
  const bind = (id, path, parser = (v) => Math.max(0, parseInt(v, 10) || 0)) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const [a, f] = path.split(".");
      updateState((s) => { s.battles[a][f] = parser(e.target.value); });
    });
  };
  bind("raid-wins", "raid.wins"); bind("raid-losses", "raid.losses");
  bind("gbl-wins", "gbl.wins"); bind("gbl-losses", "gbl.losses");
  bind("buddy-km", "buddy.km", (v) => Math.max(0, parseFloat(v) || 0));
  bind("buddy-candies", "buddy.candies"); bind("buddy-hearts", "buddy.hearts");

  renderGblPanel(b.gbl);
}

function renderGblPanel(gbl) {
  const panel = document.getElementById("gbl-panel");
  if (!panel) return;
  const leagues = [
    { key: "grande", label: "Grande" }, { key: "ultra", label: "Ultra" }, { key: "master", label: "Master" },
  ];
  panel.innerHTML = `
    <h3>🏆 GBL Dettagliato</h3>
    <div class="form-grid gbl-meta">
      <div class="form-field"><label>Stagione</label><input type="text" id="gbl-season" value="${esc(gbl.season || "")}" placeholder="es. 2025-1"></div>
      <div class="form-field"><label>Set giocati</label><input type="number" min="0" id="gbl-sets" value="${gbl.sets ?? 0}"></div>
      <div class="form-field"><label>Serie vittorie</label><input type="number" min="0" id="gbl-streak" value="${gbl.streak ?? 0}"></div>
    </div>
    <div class="gbl-leagues">${leagues.map(({ key, label }) => {
      const lg = gbl[key] || { wins: 0, losses: 0, rank: 0 };
      const wr = calcWinRate(lg.wins, lg.losses);
      return `<div class="battle-card gbl-league-card">
        <h4>Lega ${label}</h4>
        <div class="battle-field"><label>Vittorie</label><input type="number" min="0" id="gbl-${key}-wins" value="${lg.wins ?? 0}"></div>
        <div class="battle-field"><label>Sconfitte</label><input type="number" min="0" id="gbl-${key}-losses" value="${lg.losses ?? 0}"></div>
        <div class="battle-field"><label>Rank</label><input type="number" min="0" id="gbl-${key}-rank" value="${lg.rank ?? 0}"></div>
        <div class="battle-result"><span class="label">Win Rate</span><span class="value">${fmtPct(wr)}</span></div>
      </div>`;
    }).join("")}</div>`;

  document.getElementById("gbl-season")?.addEventListener("change", (e) => {
    updateState((s) => { s.battles.gbl.season = e.target.value; });
  });
  document.getElementById("gbl-sets")?.addEventListener("change", (e) => {
    updateState((s) => { s.battles.gbl.sets = Math.max(0, parseInt(e.target.value, 10) || 0); });
  });
  document.getElementById("gbl-streak")?.addEventListener("change", (e) => {
    updateState((s) => { s.battles.gbl.streak = Math.max(0, parseInt(e.target.value, 10) || 0); });
  });
  for (const key of ["grande", "ultra", "master"]) {
    document.getElementById(`gbl-${key}-wins`)?.addEventListener("change", (e) => {
      updateState((s) => { s.battles.gbl[key].wins = Math.max(0, parseInt(e.target.value, 10) || 0); });
    });
    document.getElementById(`gbl-${key}-losses`)?.addEventListener("change", (e) => {
      updateState((s) => { s.battles.gbl[key].losses = Math.max(0, parseInt(e.target.value, 10) || 0); });
    });
    document.getElementById(`gbl-${key}-rank`)?.addEventListener("change", (e) => {
      updateState((s) => { s.battles.gbl[key].rank = Math.max(0, parseInt(e.target.value, 10) || 0); });
    });
  }
}

function renderRocket() {
  const statsEl = document.getElementById("rocket-stats");
  const body = document.getElementById("rocket-body");
  if (!statsEl || !body) return;
  const r = state.rocket || { grunts: 0, leaders: 0, giovanni: 0, shadows: [] };
  const fields = [
    { key: "grunts", label: "Grunt sconfitti" },
    { key: "leaders", label: "Leader sconfitti" },
    { key: "giovanni", label: "Giovanni sconfitti" },
  ];
  statsEl.innerHTML = fields.map((f) => `
    <div class="form-field"><label>${f.label}</label><input type="number" min="0" id="rocket-${f.key}" value="${r[f.key] ?? 0}"></div>`
  ).join("");
  fields.forEach((f) => {
    document.getElementById(`rocket-${f.key}`).addEventListener("change", (e) => {
      updateState((s) => {
        if (!s.rocket) s.rocket = { grunts: 0, leaders: 0, giovanni: 0, shadows: [] };
        s.rocket[f.key] = Math.max(0, parseInt(e.target.value, 10) || 0);
      });
    });
  });

  const shadows = r.shadows || [];
  if (shadows.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-msg">Nessuno shadow registrato.</td></tr>`;
    return;
  }
  body.innerHTML = shadows.map((row, i) => `<tr data-idx="${i}">
    <td><input type="text" class="table-input" value="${esc(row.pokemon)}" data-field="pokemon"></td>
    <td><select data-field="purified"><option value="false"${!row.purified ? " selected" : ""}>No</option><option value="true"${row.purified ? " selected" : ""}>Sì</option></select></td>
    <td><input type="number" class="table-input" min="0" max="100" step="0.01" value="${row.iv ?? ""}" data-field="iv"></td>
    <td><input type="date" class="table-input" value="${row.date || ""}" data-field="date"></td>
    <td><input type="text" class="table-input" value="${esc(row.notes)}" data-field="notes"></td>
    <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
  </tr>`).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    if (field === "purified") s.rocket.shadows[idx].purified = val === "true";
    else s.rocket.shadows[idx][field] = val;
  }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.rocket.shadows.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
}

function renderMega() {
  const body = document.getElementById("mega-body");
  if (!body) return;
  if (!state.mega?.length) {
    body.innerHTML = `<tr><td colspan="5" class="empty-msg">Nessuna energia mega registrata.</td></tr>`;
    return;
  }
  body.innerHTML = state.mega.map((row, i) => `<tr data-idx="${i}">
    <td><input type="text" class="table-input" value="${esc(row.pokemon)}" data-field="pokemon"></td>
    <td><input type="number" class="table-input" min="0" value="${row.energy ?? 0}" data-field="energy"></td>
    <td><input type="number" class="table-input" min="0" value="${row.megas ?? 0}" data-field="megas"></td>
    <td><input type="text" class="table-input" value="${esc(row.notes)}" data-field="notes"></td>
    <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
  </tr>`).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    if (["energy", "megas"].includes(field)) s.mega[idx][field] = Number(val) || 0;
    else s.mega[idx][field] = val;
  }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.mega.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
}

function renderRaidBosses() {
  const grid = document.getElementById("raid-bosses-grid");
  if (!grid) return;
  grid.innerHTML = RAID_BOSSES.map((boss) => {
    const detail = getRaidBossDetail(boss.id);
    const types = (detail.pokemon?.types || []).map((t) => `<span class="type-tag">${esc(t)}</span>`).join("");
    return `<div class="raid-boss-card">
      <h4>${esc(boss.name)} <small>T${boss.tier}</small></h4>
      <div class="type-tags-wrap">${types}</div>
      <p class="raid-counters-label">Contatori:</p>
      <ul class="hunter-list">${boss.counters.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
      <button type="button" class="btn btn-secondary btn-sm raid-info-btn" data-id="${boss.id}">Dettagli</button>
    </div>`;
  }).join("");
  grid.querySelectorAll(".raid-info-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSpeciesModal(Number(btn.dataset.id)));
  });
}

function renderEggs() {
  const body = document.getElementById("eggs-body");
  if (!body) return;
  if (!state.eggs?.length) {
    body.innerHTML = `<tr><td colspan="9" class="empty-msg">Nessuna uova in incubazione.</td></tr>`;
    return;
  }
  body.innerHTML = state.eggs.map((egg, i) => `<tr data-idx="${i}">
    <td><select data-field="distance">${EGG_DISTANCES.map((d) => `<option value="${d}"${egg.distance === d ? " selected" : ""}>${d} km</option>`).join("")}</select></td>
    <td><input type="text" class="table-input" value="${esc(egg.pokemon)}" data-field="pokemon" placeholder="?"></td>
    <td><select data-field="incubator">${["Normale", "Infinite", "Super"].map((t) => `<option value="${t}"${egg.incubator === t ? " selected" : ""}>${t}</option>`).join("")}</select></td>
    <td><input type="number" class="table-input" min="0" step="0.1" value="${egg.kmWalked ?? 0}" data-field="kmWalked"></td>
    <td><select data-field="status">${["In incubazione", "Pronta", "Schiusa"].map((t) => `<option value="${t}"${egg.status === t ? " selected" : ""}>${t}</option>`).join("")}</select></td>
    <td><input type="date" class="table-input" value="${egg.startDate || ""}" data-field="startDate"></td>
    <td><input type="date" class="table-input" value="${egg.hatchDate || ""}" data-field="hatchDate"></td>
    <td><input type="text" class="table-input" value="${esc(egg.notes)}" data-field="notes"></td>
    <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
  </tr>`).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    if (field === "distance" || field === "kmWalked") s.eggs[idx][field] = Number(val) || 0;
    else s.eggs[idx][field] = val;
  }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.eggs.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
}

function renderBreakthrough() {
  const panel = document.getElementById("breakthrough-panel");
  if (!panel) return;
  const bt = state.breakthrough || { stamps: 0, lastReward: "", history: [] };
  panel.innerHTML = `
    <h3>⭐ Ricerca settimanale (Breakthrough)</h3>
    <div class="form-grid breakthrough-form">
      <div class="form-field"><label>Timbri questa settimana</label><input type="number" min="0" max="7" id="bt-stamps" value="${bt.stamps ?? 0}"></div>
      <div class="form-field"><label>Ultima ricompensa</label><input type="text" id="bt-reward" value="${esc(bt.lastReward)}" placeholder="Pokémon o oggetto"></div>
    </div>
    <div class="breakthrough-stamps">${Array.from({ length: 7 }, (_, i) =>
      `<span class="stamp${i < bt.stamps ? " filled" : ""}">${i + 1}</span>`
    ).join("")}</div>
    ${bt.history?.length ? `<ul class="hunter-list">${bt.history.slice(-5).reverse().map((h) =>
      `<li>${esc(h.date)} — ${esc(h.reward)}</li>`
    ).join("")}</ul>` : ""}`;
  document.getElementById("bt-stamps")?.addEventListener("change", (e) => {
    updateState((s) => {
      if (!s.breakthrough) s.breakthrough = { stamps: 0, lastReward: "", history: [] };
      s.breakthrough.stamps = Math.min(7, Math.max(0, parseInt(e.target.value, 10) || 0));
      if (s.breakthrough.stamps >= 7 && s.breakthrough.lastReward) {
        s.breakthrough.history.push({ date: todayISO(), reward: s.breakthrough.lastReward });
        s.breakthrough.stamps = 0;
        s.breakthrough.lastReward = "";
      }
    });
  });
  document.getElementById("bt-reward")?.addEventListener("change", (e) => {
    updateState((s) => {
      if (!s.breakthrough) s.breakthrough = { stamps: 0, lastReward: "", history: [] };
      s.breakthrough.lastReward = e.target.value;
    });
  });
}

let toolsInitialized = false;

function renderTools() {
  if (toolsInitialized) return;
  toolsInitialized = true;

  const cpForm = document.getElementById("cp-calc-form");
  if (cpForm) {
    cpForm.innerHTML = `
      <div class="form-field"><label>Attacco base</label><input type="number" min="0" id="cp-base-atk" value="100"></div>
      <div class="form-field"><label>Difesa base</label><input type="number" min="0" id="cp-base-def" value="100"></div>
      <div class="form-field"><label>PS base</label><input type="number" min="0" id="cp-base-sta" value="100"></div>
      <div class="form-field"><label>IV Att</label><input type="number" min="0" max="15" id="cp-iv-atk" value="15"></div>
      <div class="form-field"><label>IV Dif</label><input type="number" min="0" max="15" id="cp-iv-def" value="15"></div>
      <div class="form-field"><label>IV PS</label><input type="number" min="0" max="15" id="cp-iv-sta" value="15"></div>
      <div class="form-field"><label>Livello</label><input type="number" min="1" max="50" step="0.5" id="cp-level" value="40"></div>
      <button type="button" id="btn-cp-calc" class="btn btn-primary">Calcola CP</button>`;
    document.getElementById("btn-cp-calc")?.addEventListener("click", () => {
      const cp = calcCpEstimate(
        Number(document.getElementById("cp-base-atk").value) || 0,
        Number(document.getElementById("cp-base-def").value) || 0,
        Number(document.getElementById("cp-base-sta").value) || 0,
        Number(document.getElementById("cp-iv-atk").value) || 0,
        Number(document.getElementById("cp-iv-def").value) || 0,
        Number(document.getElementById("cp-iv-sta").value) || 0,
        Number(document.getElementById("cp-level").value) || 40,
      );
      document.getElementById("cp-calc-result").textContent = `CP stimato: ${fmtNum(cp)}`;
    });
  }

  const pvpForm = document.getElementById("pvp-calc-form");
  if (pvpForm) {
    pvpForm.innerHTML = `
      <div class="form-field"><label>Attacco base</label><input type="number" min="0" id="pvp-base-atk" value="100"></div>
      <div class="form-field"><label>Difesa base</label><input type="number" min="0" id="pvp-base-def" value="100"></div>
      <div class="form-field"><label>PS base</label><input type="number" min="0" id="pvp-base-sta" value="100"></div>
      <div class="form-field"><label>IV Att</label><input type="number" min="0" max="15" id="pvp-iv-atk" value="0"></div>
      <div class="form-field"><label>IV Dif</label><input type="number" min="0" max="15" id="pvp-iv-def" value="15"></div>
      <div class="form-field"><label>IV PS</label><input type="number" min="0" max="15" id="pvp-iv-sta" value="15"></div>
      <div class="form-field"><label>Lega</label><select id="pvp-league"><option value="grande">Grande (1500)</option><option value="ultra">Ultra (2500)</option><option value="master">Master</option></select></div>
      <button type="button" id="btn-pvp-calc" class="btn btn-primary">Calcola rank PvP</button>`;
    document.getElementById("btn-pvp-calc")?.addEventListener("click", () => {
      const r = calcPvpRank(
        Number(document.getElementById("pvp-base-atk").value) || 0,
        Number(document.getElementById("pvp-base-def").value) || 0,
        Number(document.getElementById("pvp-base-sta").value) || 0,
        Number(document.getElementById("pvp-iv-atk").value) || 0,
        Number(document.getElementById("pvp-iv-def").value) || 0,
        Number(document.getElementById("pvp-iv-sta").value) || 0,
        document.getElementById("pvp-league").value,
      );
      document.getElementById("pvp-calc-result").textContent =
        `Lega ${r.league}: CP ${fmtNum(r.cp)} @ livello ${r.level} · IV ${r.ivPct}% · Prodotto ${r.product}`;
    });
  }

  const compareForm = document.getElementById("compare-form");
  if (compareForm) {
    const ids = Object.keys(app.accounts);
    const opts = ids.map((id) => `<option value="${id}">${esc(app.accounts[id].name)}</option>`).join("");
    compareForm.innerHTML = `
      <div class="form-field"><label>Account A</label><select id="compare-a">${opts}</select></div>
      <div class="form-field"><label>Account B</label><select id="compare-b">${opts}</select></div>
      <button type="button" id="btn-compare" class="btn btn-primary">Confronta</button>`;
    if (ids.length > 1) document.getElementById("compare-b").value = ids[1];
    document.getElementById("btn-compare")?.addEventListener("click", () => {
      const rows = compareAccounts(
        document.getElementById("compare-a").value,
        document.getElementById("compare-b").value,
      );
      const result = document.getElementById("compare-result");
      if (!rows) { result.innerHTML = "<p class='empty-msg'>Seleziona due account.</p>"; return; }
      const nameA = app.accounts[document.getElementById("compare-a").value].name;
      const nameB = app.accounts[document.getElementById("compare-b").value].name;
      result.innerHTML = `<table class="data-table compare-table"><thead><tr><th>Metrica</th><th>${esc(nameA)}</th><th>${esc(nameB)}</th></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${esc(r.label)}</td><td>${r.a}</td><td>${r.b}</td></tr>`).join("")}</tbody></table>`;
    });
  }
}

function renderBuddies() {
  const body = document.getElementById("buddies-body");
  if (!body) return;
  if (state.buddies.length === 0) {
    body.innerHTML = `<tr><td colspan="8" class="empty-msg">Nessun buddy registrato.</td></tr>`;
    return;
  }
  body.innerHTML = state.buddies.map((b, i) => `<tr data-idx="${i}">
    <td><input type="text" class="table-input" value="${esc(b.pokemon)}" data-field="pokemon"></td>
    <td><select data-field="active"><option value="false"${!b.active ? " selected" : ""}>No</option><option value="true"${b.active ? " selected" : ""}>Sì</option></select></td>
    <td><input type="text" class="table-input" value="${esc(b.friendship)}" data-field="friendship" placeholder="Buon amico..."></td>
    <td><input type="number" class="table-input" min="0" step="0.1" value="${b.km ?? 0}" data-field="km"></td>
    <td><input type="number" class="table-input" min="0" value="${b.candies ?? 0}" data-field="candies"></td>
    <td><input type="number" class="table-input" min="0" value="${b.hearts ?? 0}" data-field="hearts"></td>
    <td><input type="date" class="table-input" value="${b.startDate || ""}" data-field="startDate"></td>
    <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
  </tr>`).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    if (field === "active") s.buddies[idx].active = val === "true";
    else if (["km", "candies", "hearts"].includes(field)) s.buddies[idx][field] = Number(val) || 0;
    else s.buddies[idx][field] = val;
  }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.buddies.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
}

function renderEvents() {
  document.querySelectorAll(".events-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === eventsView);
  });
  document.getElementById("events-list-panel")?.classList.toggle("hidden", eventsView !== "list");
  document.getElementById("events-calendar-panel")?.classList.toggle("hidden", eventsView !== "calendar");

  const body = document.getElementById("events-body");
  if (body) {
    if (state.events.length === 0) {
      body.innerHTML = `<tr><td colspan="9" class="empty-msg">Nessun evento registrato.</td></tr>`;
    } else {
      body.innerHTML = state.events.map((ev, i) => {
        const countdown = formatCountdown(daysUntil(ev.endDate || ev.date));
        return `<tr data-idx="${i}">
          <td><input type="date" class="table-input" value="${ev.date || ""}" data-field="date"></td>
          <td><input type="date" class="table-input" value="${ev.endDate || ""}" data-field="endDate"></td>
          <td><input type="text" class="table-input" value="${esc(ev.name)}" data-field="name"></td>
          <td><select data-field="type">
            ${["Community Day", "Raid Day", "GO Fest", "Spotlight Hour", "Altro"].map((t) =>
              `<option value="${t}"${ev.type === t ? " selected" : ""}>${t}</option>`).join("")}
          </select></td>
          <td><input type="text" class="table-input" value="${esc(ev.pokemon)}" data-field="pokemon"></td>
          <td><input type="number" class="table-input" min="0" value="${ev.shinies ?? 0}" data-field="shinies"></td>
          <td class="computed">${esc(countdown)}</td>
          <td><input type="text" class="table-input" value="${esc(ev.notes)}" data-field="notes"></td>
          <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
        </tr>`;
      }).join("");
      bindTableInputs(body, (idx, field, val) => updateState((s) => {
        s.events[idx][field] = field === "shinies" ? Number(val) || 0 : val;
      }));
      body.querySelectorAll("[data-del]").forEach((btn) => {
        btn.addEventListener("click", () => updateState((s) => { s.events.splice(parseInt(btn.dataset.del, 10), 1); }));
      });
    }
  }

  const cal = document.getElementById("events-calendar");
  if (cal && eventsView === "calendar") {
    const upcoming = getUpcomingEvents();
    cal.innerHTML = upcoming.length
      ? upcoming.map((ev) => {
        const cd = formatCountdown(ev.days);
        const cls = ev.days !== null && ev.days < 0 ? "past" : ev.days === 0 ? "today" : "";
        return `<div class="event-cal-card ${cls}">
          <div class="event-cal-date">${esc(ev.date)}${ev.endDate ? ` → ${esc(ev.endDate)}` : ""}</div>
          <strong>${esc(ev.name) || "Evento"}</strong>
          <span class="event-cal-type">${esc(ev.type)}</span>
          ${ev.pokemon ? `<span class="event-cal-poke">${esc(ev.pokemon)}</span>` : ""}
          <span class="event-cal-countdown">${esc(cd)}</span>
        </div>`;
      }).join("")
      : "<p class='empty-msg'>Nessun evento in calendario.</p>";
  }
}

function renderQuests() {
  const body = document.getElementById("quests-body");
  if (!body) return;
  if (state.quests.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-msg">Nessuna ricerca registrata.</td></tr>`;
    return;
  }
  body.innerHTML = state.quests.map((q, i) => `<tr data-idx="${i}">
    <td><input type="text" class="table-input" value="${esc(q.name)}" data-field="name"></td>
    <td><select data-field="type">
      ${["Speciale", "Sul campo", "Salita livello", "Timed", "Altro"].map((t) =>
        `<option value="${t}"${q.type === t ? " selected" : ""}>${t}</option>`).join("")}
    </select></td>
    <td><select data-field="status">
      ${["In corso", "Completata"].map((t) => `<option value="${t}"${q.status === t ? " selected" : ""}>${t}</option>`).join("")}
    </select></td>
    <td><input type="date" class="table-input" value="${q.dateStarted || ""}" data-field="dateStarted"></td>
    <td><input type="date" class="table-input" value="${q.dateCompleted || ""}" data-field="dateCompleted"></td>
    <td><input type="text" class="table-input" value="${esc(q.notes)}" data-field="notes"></td>
    <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
  </tr>`).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => { s.quests[idx][field] = val; }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.quests.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
}

function renderShowcase() {
  const body = document.getElementById("showcase-body");
  if (!body) return;
  if (state.showcase.length === 0) {
    body.innerHTML = `<tr><td colspan="9" class="empty-msg">Nessuna cattura in vetrina.</td></tr>`;
    return;
  }
  body.innerHTML = state.showcase.map((row, i) => {
    const iv = calcIvPercent(row.att, row.def, row.sta);
    return `<tr data-idx="${i}">
      <td><input type="date" class="table-input" value="${row.date || ""}" data-field="date"></td>
      <td><input type="text" class="table-input" value="${esc(row.pokemon)}" data-field="pokemon"></td>
      <td><input type="number" class="table-input" min="0" value="${row.cp ?? ""}" data-field="cp"></td>
      <td><input type="number" class="table-input" min="0" max="15" value="${row.att ?? ""}" data-field="att"></td>
      <td><input type="number" class="table-input" min="0" max="15" value="${row.def ?? ""}" data-field="def"></td>
      <td><input type="number" class="table-input" min="0" max="15" value="${row.sta ?? ""}" data-field="sta"></td>
      <td class="computed">${iv !== null ? iv + "%" : "—"}</td>
      <td><input type="text" class="table-input" value="${esc(row.tags)}" data-field="tags" placeholder="100%, XXL..."></td>
      <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
    </tr>`;
  }).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    s.showcase[idx][field] = ["cp", "att", "def", "sta"].includes(field) ? (val === "" ? "" : Number(val)) : val;
  }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.showcase.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
}

function renderLegendaries() {
  const body = document.getElementById("legendaries-body");
  body.innerHTML = state.legendaries.map((leg, i) => {
    const wr = leg.attempts > 0 ? leg.catches / leg.attempts : 0;
    return `<tr data-idx="${i}">
      <td>${leg.name}</td>
      <td><select data-field="caught"><option value="false"${!leg.caught ? " selected" : ""}>No</option><option value="true"${leg.caught ? " selected" : ""}>Sì</option></select></td>
      <td><select data-field="shiny"><option value="false"${!leg.shiny ? " selected" : ""}>No</option><option value="true"${leg.shiny ? " selected" : ""}>Sì</option></select></td>
      <td><input type="number" class="table-input" min="0" max="100" step="0.01" value="${leg.iv}" data-field="iv"></td>
      <td><input type="date" class="table-input" value="${leg.date || ""}" data-field="date"></td>
      <td><input type="number" class="table-input" min="0" value="${leg.attempts}" data-field="attempts"></td>
      <td><input type="number" class="table-input" min="0" value="${leg.catches}" data-field="catches"></td>
      <td class="computed">${fmtPct2(wr)}</td>
    </tr>`;
  }).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    const leg = s.legendaries[idx];
    if (field === "caught" || field === "shiny") {
      leg[field] = val === "true";
      if (field === "caught" && leg.caught) linkLegendaryCaught(leg.name, false, s);
      if (field === "shiny" && leg.shiny) linkLegendaryCaught(leg.name, true, s);
    } else if (field === "iv" || field === "date") leg[field] = val;
    else leg[field] = Math.max(0, parseInt(val, 10) || 0);
  }, { syncGen: true }));
}

function bindTableInputs(container, onChange) {
  container.querySelectorAll("tr input, tr select").forEach((el) => {
    el.addEventListener("change", () => {
      const tr = el.closest("tr");
      const idx = parseInt(tr.dataset.idx, 10);
      onChange(idx, el.dataset.field, el.value);
    });
  });
}

function openMedalModal(medalId) {
  const medal = MEDALS.find((m) => m.id === medalId);
  if (!medal) return;
  activeMedalId = medalId;
  chartPeriod = "days";
  const progress = state.medals[medalId]?.progress ?? 0;
  const tier = calcMedalTier(progress, medal);
  const pct = calcMedalProgress(progress, medal);
  const hist = state.medalHistory[medalId] || [];
  document.getElementById("medal-modal-title").textContent = medal.name;
  document.getElementById("medal-modal-desc").textContent = `${medal.category} · ${medal.desc}`;
  document.getElementById("medal-modal-stats").innerHTML = `
    <div class="modal-stat"><div class="modal-stat-label">Progresso</div><div class="modal-stat-value">${fmtNum(progress)}</div></div>
    <div class="modal-stat"><div class="modal-stat-label">Tier</div><div class="modal-stat-value ${tierClass(tier)}">${tier}</div></div>
    <div class="modal-stat"><div class="modal-stat-label">% Prossimo</div><div class="modal-stat-value">${tier === "Platino" ? "100%" : fmtPct(pct)}</div></div>
    <div class="modal-stat"><div class="modal-stat-label">Rilevazioni</div><div class="modal-stat-value">${hist.length}</div></div>`;
  document.querySelectorAll("#medal-modal .chart-period-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.period === chartPeriod);
  });
  const modal = document.getElementById("medal-modal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => drawMedalChart(medal, chartPeriod));
}

function closeMedalModal() {
  document.getElementById("medal-modal").classList.add("hidden");
  document.getElementById("medal-modal").setAttribute("aria-hidden", "true");
  activeMedalId = null;
}

function renderTypeTags(types, variant = "weak") {
  if (!types?.length) return '<span class="detail-empty">Nessuna</span>';
  return types.map((t) => `<span class="type-tag type-${variant}">${esc(t)}</span>`).join("");
}

function openSpeciesModal(id) {
  const p = POKEMON.find((x) => x.id === id);
  if (!p) return;
  document.getElementById("species-modal-title").textContent = p.name;
  const types = (p.types || []).join(" · ") || "—";
  document.getElementById("species-modal-desc").textContent =
    `#${String(p.id).padStart(4, "0")} · Gen ${p.gen} · ${types}`;

  const weatherList = document.getElementById("species-modal-weather");
  if (p.weatherBoosts?.length) {
    weatherList.innerHTML = p.weatherBoosts.map((w) =>
      `<li><strong>${esc(w.weather)}</strong> → boost ${w.types.map((t) => esc(t)).join(", ")}</li>`).join("");
  } else {
    weatherList.innerHTML = "<li>Nessun boost meteo (tipo singolare o dati assenti)</li>";
  }

  const wk = p.weaknesses || {};
  const weakParts = [
    ...(wk.doubleWeak || []).map((t) => ({ t, label: "×2.56" })),
    ...(wk.weak || []).map((t) => ({ t, label: "×1.6" })),
  ];
  document.getElementById("species-modal-weaknesses").innerHTML = weakParts.length
    ? weakParts.map(({ t, label }) => `<span class="type-tag type-weak" title="Danno ${label}">${esc(t)} <small>${label}</small></span>`).join("")
    : '<span class="detail-empty">Nessuna debolezza</span>';

  const resistParts = [
    ...(wk.doubleResist || []).map((t) => ({ t, label: "×0.39" })),
    ...(wk.resist || []).map((t) => ({ t, label: "×0.62" })),
  ];
  document.getElementById("species-modal-resistances").innerHTML = resistParts.length
    ? resistParts.map(({ t, label }) => `<span class="type-tag type-resist" title="Danno ${label}">${esc(t)} <small>${label}</small></span>`).join("")
    : '<span class="detail-empty">Nessuna resistenza</span>';

  const counters = getRaidCounters(id);
  document.getElementById("species-modal-counters").innerHTML = counters.length
    ? counters.map((t) => `<span class="type-tag type-weak">${esc(t)}</span>`).join("")
    : '<span class="detail-empty">Nessun dato</span>';

  document.getElementById("species-modal-obtain").innerHTML =
    (p.obtain || []).map((o) => `<li>${esc(o)}</li>`).join("") || "<li>Dati non disponibili</li>";

  const fromBlock = document.getElementById("species-evolves-from-block");
  const fromList = document.getElementById("species-modal-from");
  if (p.evolvesFrom?.length) {
    fromBlock.classList.remove("hidden");
    fromList.innerHTML = p.evolvesFrom.map((e) =>
      `<li><strong>${esc(e.fromName)}</strong> — ${esc(e.how)}</li>`).join("");
  } else {
    fromBlock.classList.add("hidden");
    fromList.innerHTML = "";
  }

  const toBlock = document.getElementById("species-evolves-to-block");
  const toList = document.getElementById("species-modal-to");
  if (p.evolvesTo?.length) {
    toBlock.classList.remove("hidden");
    toList.innerHTML = p.evolvesTo.map((e) =>
      `<li><strong>${esc(e.name)}</strong> — ${esc(e.how)}</li>`).join("");
  } else {
    toBlock.classList.add("hidden");
    toList.innerHTML = "";
  }

  const buddy = document.getElementById("species-modal-buddy");
  buddy.textContent = p.buddyKm
    ? `Buddy: 1 caramella ogni ${p.buddyKm} km percorsi insieme.`
    : "";

  const modal = document.getElementById("species-modal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeSpeciesModal() {
  document.getElementById("species-modal").classList.add("hidden");
  document.getElementById("species-modal").setAttribute("aria-hidden", "true");
}

function initSpeciesModal() {
  document.getElementById("species-modal-close").addEventListener("click", closeSpeciesModal);
  document.getElementById("species-modal-backdrop").addEventListener("click", closeSpeciesModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSpeciesModal();
  });
}

function initNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`section-${btn.dataset.section}`).classList.add("active");
      closeMobileMenu();
    });
  });
}

function closeMobileMenu() {
  document.getElementById("sidebar")?.classList.remove("open");
  document.getElementById("sidebar-overlay")?.classList.add("hidden");
}

function initMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  document.getElementById("btn-menu")?.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    overlay.classList.toggle("hidden", !open);
  });
  overlay?.addEventListener("click", closeMobileMenu);
}

function initMedalModal() {
  document.getElementById("medal-modal-close").addEventListener("click", closeMedalModal);
  document.getElementById("medal-modal-backdrop").addEventListener("click", closeMedalModal);
  document.querySelectorAll("#medal-modal .chart-period-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      chartPeriod = btn.dataset.period;
      document.querySelectorAll("#medal-modal .chart-period-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.period === chartPeriod);
      });
      const medal = MEDALS.find((m) => m.id === activeMedalId);
      if (medal) drawMedalChart(medal, chartPeriod);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeMedalId) closeMedalModal();
  });
}

function initGlobalSearch() {
  const input = document.getElementById("global-search");
  const results = document.getElementById("global-search-results");
  if (!input || !results) return;
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = input.value.trim();
      if (!q) { results.classList.add("hidden"); return; }
      const items = globalSearch(q);
      if (!items.length) {
        results.innerHTML = "<p class='empty-msg'>Nessun risultato.</p>";
      } else {
        results.innerHTML = items.map((item, i) =>
          `<button type="button" class="search-result-item" data-idx="${i}">
            <span>${item.icon}</span> <strong>${esc(item.title)}</strong><br><small>${esc(item.subtitle)}</small>
          </button>`
        ).join("");
        results.querySelectorAll(".search-result-item").forEach((btn) => {
          btn.addEventListener("click", () => {
            const item = items[parseInt(btn.dataset.idx, 10)];
            if (item.action) item.action();
            else if (item.section) document.querySelector(`.nav-btn[data-section="${item.section}"]`)?.click();
            results.classList.add("hidden");
            input.value = "";
          });
        });
      }
      results.classList.remove("hidden");
    }, 200);
  });
  document.addEventListener("click", (e) => {
    if (!input.contains(e.target) && !results.contains(e.target)) results.classList.add("hidden");
  });
}

function init() {
  loadApp();
  seedHistories();
  initNav();
  initMobileMenu();
  initGlobalSearch();
  initMedalModal();
  initSpeciesModal();
  renderAll();
  renderTools();

  document.getElementById("account-select").addEventListener("change", (e) => switchAccount(e.target.value));
  document.getElementById("account-name").addEventListener("change", (e) => {
    updateState((s) => { s.name = e.target.value.trim() || "Allenatore"; });
  });
  document.getElementById("btn-new-account").addEventListener("click", () => {
    const name = prompt("Nome nuovo account:", `Account ${Object.keys(app.accounts).length + 1}`);
    if (name !== null) createAccount(name);
  });
  document.getElementById("btn-delete-account").addEventListener("click", () => {
    if (Object.keys(app.accounts).length <= 1) return alert("Serve almeno un account.");
    if (confirm("Eliminare l'account corrente e tutti i suoi dati?")) deleteAccount(app.activeAccountId);
  });
  document.getElementById("btn-theme").addEventListener("click", () => {
    setTheme(app.settings.theme === "light" ? "dark" : "light");
    renderAll();
  });

  document.querySelectorAll(".pokedex-tab").forEach((btn) => {
    btn.addEventListener("click", () => { pokedexTab = btn.dataset.tab; renderPokedex(); renderSpeciesDex(); });
  });

  document.querySelectorAll(".dash-chart-tab").forEach((btn) => {
    btn.addEventListener("click", () => { dashChartMetric = btn.dataset.metric; renderDashboard(); });
  });
  document.querySelectorAll(".dash-period-btn").forEach((btn) => {
    btn.addEventListener("click", () => { dashChartPeriod = btn.dataset.period; renderDashboard(); });
  });

  document.getElementById("btn-add-shiny").addEventListener("click", () => {
    updateState((s) => { s.shiny.push({ date: "", pokemon: "", cp: "", att: "", def: "", sta: "", method: "", notes: "" }); });
  });
  document.getElementById("btn-add-buddy").addEventListener("click", () => {
    updateState((s) => { s.buddies.push({ pokemon: "", active: false, friendship: "", km: 0, candies: 0, hearts: 0, startDate: todayISO() }); });
  });
  document.getElementById("btn-add-event").addEventListener("click", () => {
    updateState((s) => { s.events.push({ date: todayISO(), endDate: "", name: "", type: "Community Day", pokemon: "", shinies: 0, notes: "" }); });
  });
  document.querySelectorAll(".events-tab").forEach((btn) => {
    btn.addEventListener("click", () => { eventsView = btn.dataset.view; renderEvents(); });
  });
  document.getElementById("btn-add-egg")?.addEventListener("click", () => {
    updateState((s) => {
      if (!s.eggs) s.eggs = [];
      s.eggs.push({ distance: 2, pokemon: "", incubator: "Normale", kmWalked: 0, status: "In incubazione", startDate: todayISO(), hatchDate: "", notes: "" });
    });
  });
  document.getElementById("btn-add-quest").addEventListener("click", () => {
    updateState((s) => { s.quests.push({ name: "", type: "Speciale", status: "In corso", dateStarted: todayISO(), dateCompleted: "", notes: "" }); });
  });
  document.getElementById("btn-add-showcase").addEventListener("click", () => {
    updateState((s) => { s.showcase.push({ date: todayISO(), pokemon: "", cp: "", att: "", def: "", sta: "", tags: "" }); });
  });
  document.getElementById("btn-add-shadow")?.addEventListener("click", () => {
    updateState((s) => {
      if (!s.rocket) s.rocket = { grunts: 0, leaders: 0, giovanni: 0, shadows: [] };
      s.rocket.shadows.push({ pokemon: "", purified: false, iv: "", date: todayISO(), notes: "" });
    });
  });
  document.getElementById("btn-add-mega")?.addEventListener("click", () => {
    updateState((s) => {
      if (!s.mega) s.mega = [];
      s.mega.push({ pokemon: "", energy: 0, megas: 0, notes: "" });
    });
  });

  document.getElementById("btn-export").addEventListener("click", exportDataWithBackupMark);
  document.getElementById("btn-export-csv")?.addEventListener("click", exportCsvData);
  document.getElementById("btn-export-excel").addEventListener("click", exportExcelData);
  document.getElementById("btn-import").addEventListener("click", () => document.getElementById("import-file").click());
  document.getElementById("import-file").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("btn-import-csv")?.addEventListener("click", () => document.getElementById("import-csv-file").click());
  document.getElementById("import-csv-file")?.addEventListener("change", (e) => {
    if (e.target.files[0]) importCsvFile(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("btn-import-xlsx")?.addEventListener("click", () => document.getElementById("import-xlsx-file").click());
  document.getElementById("import-xlsx-file")?.addEventListener("change", (e) => {
    if (e.target.files[0]) importXlsxFile(e.target.files[0]);
    e.target.value = "";
  });
  document.getElementById("btn-pdf-card")?.addEventListener("click", exportTrainerCard);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
