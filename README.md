# Pokémon GO Tracker

Tracker completo per i progressi in **Pokémon GO** con inserimento manuale dei dati e calcoli automatici.

Il repository contiene **due soluzioni** complementari:

| Soluzione | File | Uso ideale |
|-----------|------|------------|
| **Excel** | `PokemonGO_Tracker.xlsx` | Foglio di calcolo offline, stampa, condivisione |
| **App Web** | `app/` | Interfaccia moderna nel browser, salvataggio automatico |

---

## Legenda colori (Excel)

| Colore | Significato |
|--------|-------------|
| 🟡 **Giallo** | Celle da compilare **manualmente** |
| 🟢 **Verde** | Celle con **formule automatiche** — non modificare |

---

## 1. File Excel

### Rigenerare il file

Se modifichi la struttura o vuoi un file pulito:

```bash
pip install openpyxl
python3 generate_excel.py
```

Viene creato/sovrascritto `PokemonGO_Tracker.xlsx`.

### Fogli disponibili

#### Dashboard
Riepilogo automatico di:
- Risorse (Stardust, Polvere Lucente, Poké Ball, Mega Energy, XP)
- Livello attuale e XP mancanti al prossimo livello
- Pokédex (% catturati e visti)
- Conteggio shiny registrati
- Win rate Raid e GBL
- Leggendari catturati e shiny

**Inserimento manuale:** risorse nella colonna B (righe 5–9).

#### Pokédex
Gen 1–9 con colonne:

| Colonna | Tipo |
|---------|------|
| Totale | Automatico (151, 100, 135…) |
| Catturati | **Manuale** |
| Visti | **Manuale** |
| Mancanti | Automatico (= Totale − Catturati) |
| % Catturati | Automatico |
| % Visti | Automatico |

#### Shiny
Registro shiny con IV% calcolato:

```
IV% = (Att + Dif + PS) / 45 × 100
```

**Manuale:** Data, Pokémon, CP, IV Att/Dif/PS, Metodo, Note.

#### XP
Tabella di riferimento livelli 1–80 con XP cumulativo (solo lettura).

> **Nota:** dall'aggiornamento di ottobre 2025 il cap è **livello 80**. I livelli 71–80 richiedono anche ricerche di salita di livello oltre all'XP necessario.

#### Medaglie
**69 medaglie** con soglie ufficiali Bronzo/Argento/Oro/Platino, organizzate per categoria:

| Categoria | Esempi |
|-----------|--------|
| **Pokédex** | Kanto, Johto, Hoenn … Paldea |
| **Tipo** | Studente, Accendino, Domatore … (18 tipi) |
| **Attività** | Podista, Collezionista, Zaino, Turista … |
| **Battaglia** | Campione, Leggenda delle lotte, Capopalestra, Veterano GBL … |
| **Sociale** | Gentiluomo, Pilota, Migliori amici, Idolo … |
| **Team GO Rocket** | Eroe, Ultra Eroe, Purificatore |
| **Megaevoluzione** | Successore, Guru Megaevoluzione |
| **Speciale** | Unown, Fan di Pikachu, Vivillon, Wayfarer … |

**Manuale:** colonna Progresso.

**Automatico:** Tier e % verso il prossimo livello.

> L'elenco completo è in `medals.json` (fonte dati condivisa tra Excel e app).

#### Battaglie
- **Raid:** Vittorie, Sconfitte → Win Rate
- **GBL:** Vittorie, Sconfitte → Win Rate
- **Buddy:** Km, Caramelle, Cuori → Caramelle/Km

#### Leggendari
Lista di 54 leggendari. Per ciascuno:

**Manuale:** Catturato (Sì/No), Shiny, IV%, Data, Tentativi, Catture.

**Automatico:** Win Rate = Catture ÷ Tentativi.

---

## 2. App Web Desktop

App HTML/CSS/JS standalone, funziona **offline** senza installazione.

### Avvio

**Opzione A — Aprire direttamente il file:**

```bash
# Su Linux
xdg-open app/index.html

# Su macOS
open app/index.html

# Su Windows
start app/index.html
```

**Opzione B — Server locale (consigliato per alcuni browser):**

```bash
cd app
python3 -m http.server 8080
```

Poi apri [http://localhost:8080](http://localhost:8080) nel browser.

### Funzionalità

| Sezione | Cosa inserire | Calcoli automatici |
|---------|---------------|-------------------|
| **Dashboard** | — | Riepilogo da tutte le sezioni |
| **Pokédex** | Catturati, Visti per gen | Mancanti, % |
| **Shiny** | Data, Pokémon, CP, IV, Metodo | IV% |
| **Risorse** | Stardust, Polvere, Ball, Mega Energy, XP | Livello (1–80), barra progresso XP |
| **Medaglie** | Progresso | Tier, % prossimo livello |
| **Battaglie** | Raid/GBL V-P, Buddy km/caramelle/cuori | Win rate, caramelle/km |
| **Leggendari** | Catturato, Shiny, IV%, Data, Tentativi | Win rate |

### Salvataggio

I dati vengono salvati automaticamente in **localStorage** del browser ad ogni modifica.

### Backup JSON

- **Esporta JSON** — scarica un backup completo
- **Importa JSON** — ripristina da un backup precedente

> I dati Excel e quelli dell'app **non si sincronizzano** automaticamente. Usa l'export/import JSON per migrare tra dispositivi o fare backup dell'app.

---

## Cosa inserire manualmente vs automatico

### Inserimento manuale
- Risorse (Stardust, Polvere Lucente, Poké Ball, Mega Energy, XP)
- Pokédex: catturati e visti per generazione
- Ogni shiny (data, Pokémon, CP, IV, metodo, note)
- Progresso medaglie
- Statistiche raid, GBL e buddy
- Dati leggendari (catturato, shiny, IV%, data, tentativi, catture)

### Calcolato automaticamente
- % Pokédex (catturati e visti)
- IV% shiny: `(Att + Dif + PS) / 45 × 100`
- Livello da XP totale (tabella 1–80)
- XP mancanti e barra di progresso
- Win rate raid e GBL: `Vittorie / (Vittorie + Sconfitte)`
- Caramelle per km buddy: `Caramelle / Km`
- Tier medaglie e % verso il prossimo livello
- Win rate leggendari: `Catture / Tentativi raid`
- Tutti i totali e riepiloghi nella Dashboard

---

## Struttura repository

```
pokemon-go-tracker/
├── PokemonGO_Tracker.xlsx   # Foglio Excel generato
├── generate_excel.py        # Script per rigenerare l'Excel
├── README.md
├── .gitignore
└── app/
    ├── index.html
    ├── app.js
    └── styles.css
```

---

## Requisiti

- **Excel:** Microsoft Excel, LibreOffice Calc o Google Sheets (importando il file)
- **Script Python:** Python 3.8+ e `openpyxl`
- **App Web:** qualsiasi browser moderno (Chrome, Firefox, Edge, Safari)

---

## Note

- I totali Pokédex per generazione riflettono il dex nazionale completo (Gen 1–9 = 1025 Pokémon). Aggiorna manualmente i valori se nel gioco non sono ancora tutti disponibili.
- Per le medaglie, le soglie seguono i valori standard di Pokémon GO (Bronzo/Argento/Oro/Platino).
- L'app è pensata per uso personale offline; non raccoglie né invia dati a server esterni.
