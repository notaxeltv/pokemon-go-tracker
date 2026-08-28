/* Pokémon GO Tracker — UI e rendering */

let medalFilter = "all";
let medalSearch = "";
let medalSort = "name";
let speciesGenFilter = "all";
let speciesStatusFilter = "all";
let speciesSearch = "";
let activeMedalId = null;
let chartPeriod = "days";
let dashChartMetric = "xp";
let dashChartPeriod = "days";
let pokedexTab = "gens";

const MEDAL_CATEGORIES = ["all", ...new Set(MEDALS.map((m) => m.category))];

function renderAll() {
  renderAccountBar();
  renderDashboard();
  renderPokedex();
  renderSpeciesDex();
  renderShiny();
  renderResources();
  renderMedals();
  renderBattles();
  renderBuddies();
  renderEvents();
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
  toolbar.innerHTML = `
    <input type="search" id="species-search" class="search-input" placeholder="Cerca Pokémon..." value="${esc(speciesSearch)}">
    <select id="species-gen-filter" class="select-input">${gens.map((g) => `<option value="${g}"${speciesGenFilter === g ? " selected" : ""}>${g === "all" ? "Tutte le gen" : "Gen " + g}</option>`).join("")}</select>
    <select id="species-status-filter" class="select-input">
      <option value="all"${speciesStatusFilter === "all" ? " selected" : ""}>Tutti</option>
      <option value="missing"${speciesStatusFilter === "missing" ? " selected" : ""}>Mancanti</option>
      <option value="seen"${speciesStatusFilter === "seen" ? " selected" : ""}>Visti</option>
      <option value="caught"${speciesStatusFilter === "caught" ? " selected" : ""}>Catturati</option>
      <option value="shiny"${speciesStatusFilter === "shiny" ? " selected" : ""}>Shiny</option>
    </select>`;

  document.getElementById("species-search").addEventListener("input", (e) => { speciesSearch = e.target.value.toLowerCase(); renderSpeciesDex(); });
  document.getElementById("species-gen-filter").addEventListener("change", (e) => { speciesGenFilter = e.target.value; renderSpeciesDex(); });
  document.getElementById("species-status-filter").addEventListener("change", (e) => { speciesStatusFilter = e.target.value; renderSpeciesDex(); });

  let list = POKEMON.filter((p) => {
    if (speciesGenFilter !== "all" && p.gen !== Number(speciesGenFilter)) return false;
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
  grid.innerHTML = list.slice(0, 300).map((p) => {
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
  }).join("") + (list.length > 300 ? `<p class="empty-msg">Mostrati 300 di ${list.length}. Affina la ricerca.</p>` : "");

  grid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (ev) => {
      ev.stopPropagation();
      const id = Number(input.dataset.id);
      const field = input.dataset.field;
      updateState((s) => {
        const entry = getSpeciesEntry(id);
        entry[field] = input.checked;
        if (field === "caught" && input.checked) entry.seen = true;
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
  const body = document.getElementById("events-body");
  if (!body) return;
  if (state.events.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="empty-msg">Nessun evento registrato.</td></tr>`;
    return;
  }
  body.innerHTML = state.events.map((ev, i) => `<tr data-idx="${i}">
    <td><input type="date" class="table-input" value="${ev.date || ""}" data-field="date"></td>
    <td><input type="text" class="table-input" value="${esc(ev.name)}" data-field="name"></td>
    <td><select data-field="type">
      ${["Community Day", "Raid Day", "GO Fest", "Spotlight Hour", "Altro"].map((t) =>
        `<option value="${t}"${ev.type === t ? " selected" : ""}>${t}</option>`).join("")}
    </select></td>
    <td><input type="text" class="table-input" value="${esc(ev.pokemon)}" data-field="pokemon"></td>
    <td><input type="number" class="table-input" min="0" value="${ev.shinies ?? 0}" data-field="shinies"></td>
    <td><input type="text" class="table-input" value="${esc(ev.notes)}" data-field="notes"></td>
    <td><button class="btn btn-danger" data-del="${i}">✕</button></td>
  </tr>`).join("");
  bindTableInputs(body, (idx, field, val) => updateState((s) => {
    s.events[idx][field] = field === "shinies" ? Number(val) || 0 : val;
  }));
  body.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => updateState((s) => { s.events.splice(parseInt(btn.dataset.del, 10), 1); }));
  });
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
    if (field === "caught" || field === "shiny") leg[field] = val === "true";
    else if (field === "iv" || field === "date") leg[field] = val;
    else leg[field] = Math.max(0, parseInt(val, 10) || 0);
  }));
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
    });
  });
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

function init() {
  loadApp();
  seedHistories();
  initNav();
  initMedalModal();
  initSpeciesModal();
  renderAll();

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
    updateState((s) => { s.events.push({ date: todayISO(), name: "", type: "Community Day", pokemon: "", shinies: 0, notes: "" }); });
  });
  document.getElementById("btn-add-quest").addEventListener("click", () => {
    updateState((s) => { s.quests.push({ name: "", type: "Speciale", status: "In corso", dateStarted: todayISO(), dateCompleted: "", notes: "" }); });
  });
  document.getElementById("btn-add-showcase").addEventListener("click", () => {
    updateState((s) => { s.showcase.push({ date: todayISO(), pokemon: "", cp: "", att: "", def: "", sta: "", tags: "" }); });
  });

  document.getElementById("btn-export").addEventListener("click", exportData);
  document.getElementById("btn-export-excel").addEventListener("click", exportExcelData);
  document.getElementById("btn-import").addEventListener("click", () => document.getElementById("import-file").click());
  document.getElementById("import-file").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", init);
