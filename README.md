# Pokémon GO Tracker

Tracker completo per i progressi in **Pokémon GO** con inserimento manuale dei dati e calcoli automatici.

| Soluzione | File | Uso ideale |
|-----------|------|------------|
| **Excel** | `PokemonGO_Tracker.xlsx` | Foglio di calcolo offline, stampa, condivisione |
| **App Web (PWA)** | `app/` | Interfaccia moderna, installabile, salvataggio automatico |

---

## Funzionalità principali

### App Web
- **Dashboard** con riepilogo, obiettivi vicini e grafici storici (XP, Stardust, % Pokédex, raid)
- **Pokédex** per generazione e **checklist 1025 specie** con filtri
- **Shiny**, **Vetrina** (migliori catture), **Risorse & Livello** (1–80)
- **72 medaglie** con grafico storico e ricerca/ordinamento
- **Battaglie**, **Buddy** dettagliato, **Eventi**, **Ricerche**
- **Leggendari** con win rate
- **Multi-account** con switch rapido
- **Tema chiaro/scuro**
- **PWA** installabile sul telefono (offline)
- **Backup JSON** e **Sync Excel JSON** per collegare app e foglio

### Excel
Fogli: Dashboard, Pokédex, Specie (1025), Shiny, XP, Medaglie, Battaglie, Buddy, Eventi, Ricerche, Vetrina, Leggendari.

---

## Avvio app

```bash
cd app
python3 -m http.server 8080
```

Apri [http://localhost:8080](http://localhost:8080). Puoi anche installarla come app dal browser (PWA).

---

## Sincronizzazione Excel ↔ App

1. Nell'app: **Sync Excel** → scarica `pokemon-go-tracker-excel-YYYY-MM-DD.json`
2. Nell'app: **Importa JSON** → seleziona il file per ripristinare
3. Per migrare dati dall'app a Excel: compila manualmente i fogli corrispondenti usando il JSON come riferimento, oppure importa il backup JSON nell'app su un altro dispositivo

> I due formati non si aggiornano in tempo reale: usa export/import JSON per i backup periodici.

---

## Rigenerare Excel e dati

```bash
pip install openpyxl
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
├── pokemon.json
├── README.md
└── app/
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── core.js
    ├── charts.js
    ├── sync.js
    ├── app.js
    ├── medals.js
    ├── pokemon.js
    └── styles.css
```

---

## Note

- Nessuna connessione a server esterni in runtime: tutto offline.
- Lo storico (medaglie, dashboard) si aggiorna quando modifichi i dati.
- I livelli 71–80 richiedono anche ricerche di salita di livello oltre all'XP.
