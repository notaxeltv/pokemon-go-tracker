# Pokémon GO Tracker

Tracker completo per i progressi in **Pokémon GO** con inserimento manuale dei dati e calcoli automatici.

| Soluzione | File | Uso ideale |
|-----------|------|------------|
| **Excel** | `PokemonGO_Tracker.xlsx` | Foglio di calcolo offline, stampa, condivisione |
| **App Web (PWA)** | `app/` | Interfaccia moderna, installabile, salvataggio automatico |

---

## Funzionalità principali

### App Web
- **Dashboard** con riepilogo, obiettivi vicini, stima giorni al livello successivo e grafici storici (XP, Stardust, % Pokédex, raid)
- **Mancanti** — Pokédex, shiny, leggendari shiny e medaglie vicine al platino
- **Pokédex** per generazione e **checklist 1025 specie** con filtri
  - Per ogni Pokémon: **come si ottiene**, **come evolve**, **boost meteo**, **debolezze/resistenze** e **contatori raid**
  - Auto-collegamento tra specie, shiny e leggendari
- **Shiny**, **Vetrina** (migliori catture), **Risorse & Livello** (1–80) con inventario esteso
- **72 medaglie** con grafico storico e ricerca/ordinamento
- **Battaglie** con GBL dettagliato (Grande/Ultra/Master, rank, stagione)
- **Team GO Rocket** (grunt, leader, Giovanni, shadow)
- **Megaevoluzione** (energia e conteggio mega)
- **Buddy** dettagliato, **Eventi**, **Ricerche**
- **Leggendari** con win rate
- **Strumenti**: calcolatore CP, confronto account, scheda allenatore PDF/stampa
- **Import CSV/Excel** (compatibile export Poke Genie e simili)
- **Multi-account** con switch rapido
- **Tema chiaro/scuro**
- **PWA** installabile su Android e iPhone (offline, guida installazione iOS)
- **Menu mobile** con sidebar a scomparsa
- **Promemoria backup** automatico ogni 30 giorni
- **Backup JSON** e **Sync Excel JSON** per collegare app e foglio

### Excel
Fogli: Dashboard, Pokédex, Specie (1025), Shiny, XP, Medaglie, Battaglie, Buddy, Eventi, Ricerche, Vetrina, Leggendari, Rocket, Mega.

---

## Avvio app

```bash
cd app
python3 -m http.server 8080
```

Apri [http://localhost:8080](http://localhost:8080). Puoi anche installarla come app dal browser (PWA).

### Installazione su iPhone
1. Apri l'app in **Safari**
2. Tocca **Condividi** → **Aggiungi a Home**
3. L'app funziona offline dopo il primo caricamento

---

## Sincronizzazione Excel ↔ App

1. Nell'app: **Sync Excel** → scarica `pokemon-go-tracker-excel-YYYY-MM-DD.json`
2. Nell'app: **Importa JSON** → seleziona il file per ripristinare
3. Per migrare dati dall'app a Excel: compila manualmente i fogli corrispondenti usando il JSON come riferimento, oppure importa il backup JSON nell'app su un altro dispositivo

> I due formati non si aggiornano in tempo reale: usa export/import JSON per i backup periodici.

### Import CSV / Excel
- **Importa CSV**: file export da Poke Genie o tracker simili (colonne Pokémon, CP, IV, Shiny)
- **Importa Excel**: file `.xlsx` con struttura tabellare simile

---

## Rigenerare Excel e dati

```bash
pip install openpyxl
python3 build_pokemon_go_data.py   # opzionale: aggiorna ottenimento/evoluzione
python3 generate_excel.py
```

Genera `PokemonGO_Tracker.xlsx`, `app/medals.js` e `app/pokemon.js` da `medals.json` e `pokemon.json`.

---

## Struttura repository

```
pokemon-go-tracker/
├── PokemonGO_Tracker.xlsx
├── generate_excel.py
├── medals.json
├── pokemon.json             # Specie + ottenimento/evoluzione (generato da build_pokemon_go_data.py)
├── build_pokemon_go_data.py # Arricchisce pokemon.json da dati GO
├── README.md
└── app/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── core.js
    ├── extras.js
    ├── tools.js
    ├── charts.js
    ├── sync.js
    ├── app.js
    ├── medals.js
    ├── pokemon.js
    ├── vendor/xlsx.mini.min.js
    └── styles.css
```

---

## Note

- Nessuna connessione a server esterni in runtime: tutto offline.
- Lo storico (medaglie, dashboard) si aggiorna quando modifichi i dati.
- I livelli 71–80 richiedono anche ricerche di salita di livello oltre all'XP.
