/* Import CSV/XLSX, PDF scheda allenatore */

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if ((c === "," || c === ";") && !inQ) { out.push(cur.trim()); cur = ""; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function importPokeGenieCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV vuoto");
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const idx = (names) => headers.findIndex((h) => names.some((n) => h.includes(n)));

  const iName = idx(["pokemon", "name", "species"]);
  const iCp = idx(["cp"]);
  const iAtt = idx(["attack", "att", "atk"]);
  const iDef = idx(["defense", "def"]);
  const iSta = idx(["stamina", "hp", "sta"]);
  const iIv = idx(["iv", "ivpercent", "ivpct"]);
  const iShiny = idx(["shiny"]);

  let imported = 0;
  updateState((s) => {
    for (let li = 1; li < lines.length; li++) {
      const cols = parseCsvLine(lines[li]);
      const name = cols[iName >= 0 ? iName : 0];
      if (!name) continue;
      const poke = findPokemonByName(name);
      const isShiny = iShiny >= 0 && /^(1|true|yes|s[iì])/i.test(cols[iShiny] || "");
      if (poke) {
        linkSpeciesCaught(poke.id, s);
        if (isShiny) linkSpeciesShiny(poke.id, poke.name, s);
      }
      const att = iAtt >= 0 ? cols[iAtt] : "";
      const def = iDef >= 0 ? cols[iDef] : "";
      const sta = iSta >= 0 ? cols[iSta] : "";
      const iv = iIv >= 0 ? cols[iIv] : (att !== "" && def !== "" && sta !== "" ? calcIvPercent(att, def, sta) : "");
      if (isShiny) {
        const row = {
          date: todayISO(), pokemon: name, cp: iCp >= 0 ? cols[iCp] : "",
          att, def, sta, method: "Import CSV", notes: iv ? `IV ${iv}%` : "",
        };
        if (!s.shiny.some((r) => r.pokemon?.toLowerCase() === name.toLowerCase() && r.date === row.date)) {
          s.shiny.push(row);
        }
      }
      imported++;
    }
  }, { syncGen: true, recordGlobal: true });
  return imported;
}

function importCsvFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const n = importPokeGenieCsv(e.target.result);
      alert(`Importati ${n} record dal CSV.`);
    } catch (err) {
      alert("Errore CSV: " + err.message);
    }
  };
  reader.readAsText(file);
}

async function ensureXlsx() {
  if (window.XLSX) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "vendor/xlsx.mini.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Libreria XLSX non disponibile"));
    document.head.appendChild(s);
  });
}

async function importXlsxFile(file) {
  try {
    await ensureXlsx();
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rows.length) throw new Error("Foglio vuoto");
    const text = rows.map((r) => r.join(",")).join("\n");
    const n = importPokeGenieCsv(text);
    alert(`Importati ${n} righe dall'Excel.`);
  } catch (err) {
    alert("Errore Excel: " + err.message);
  }
}

function exportTrainerCard() {
  const snap = getAccountSnapshot(state);
  const eta = estimateDaysToLevel();
  const missing = getMissingDex(15);
  const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Scheda ${esc(state.name)}</title>
<style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{margin:0 0 8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.card{border:1px solid #ccc;border-radius:8px;padding:12px}ul{padding-left:18px}@media print{button{display:none}}</style></head><body>
<h1>⚡ ${esc(state.name)}</h1><p>Scheda allenatore · ${todayISO()}</p>
<div class="grid">
<div class="card"><strong>Livello</strong><br>${snap.level}</div>
<div class="card"><strong>Pokédex</strong><br>${fmtPct(snap.dexPct)}</div>
<div class="card"><strong>Medaglie Platino</strong><br>${snap.platinumMedals} / ${MEDALS.length}</div>
<div class="card"><strong>Shiny</strong><br>${snap.shiny}</div>
<div class="card"><strong>Leggendari</strong><br>${snap.legendaries} / ${LEGENDARIES.length}</div>
<div class="card"><strong>Stardust</strong><br>${fmtNum(snap.stardust)}</div>
</div>
${eta ? `<p><strong>Stima livello successivo:</strong> ~${eta.days} giorni (${fmtNum(eta.xpPerDay)} XP/giorno)</p>` : ""}
<h3>Mancanti nel dex (primi 15)</h3><ul>${missing.map((p) => `<li>#${p.id} ${esc(p.name)}</li>`).join("") || "<li>Completato!</li>"}</ul>
<button onclick="window.print()">Stampa / Salva PDF</button></body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  markBackupDone();
}

function exportDataWithBackupMark() {
  exportData();
  markBackupDone();
}
