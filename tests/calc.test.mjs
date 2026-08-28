import assert from "node:assert/strict";

const XP_TABLE = [
  0, 2500, 5500, 9000, 13000, 18000, 24000, 31000, 39000, 48000,
  58000, 70000, 84000, 100000, 118000, 139000, 163500, 191500, 223000, 258000,
];

function calcLevelFromXp(xp) {
  let level = 1;
  for (let i = 0; i < XP_TABLE.length; i++) {
    if (xp >= XP_TABLE[i]) level = i + 1;
    else break;
  }
  return Math.min(level, 80);
}

function calcIvPercent(att, def, sta) {
  const a = Number(att), d = Number(def), st = Number(sta);
  if ([a, d, st].some((v) => isNaN(v) || v === "")) return null;
  return Math.round(((a + d + st) / 45) * 10000) / 100;
}

function calcMedalTier(progress, { bronze, silver, gold, platinum }) {
  if (progress >= platinum) return "Platino";
  if (progress >= gold) return "Oro";
  if (progress >= silver) return "Argento";
  if (progress >= bronze) return "Bronzo";
  return "Nessuno";
}

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

assert.equal(calcLevelFromXp(0), 1);
assert.equal(calcLevelFromXp(2500), 2);
assert.equal(calcLevelFromXp(258000), 20);
assert.equal(calcIvPercent(15, 15, 15), 100);
assert.equal(calcIvPercent(0, 15, 15), 66.67);
assert.equal(calcMedalTier(250, { bronze: 10, silver: 50, gold: 200, platinum: 1000 }), "Oro");
assert.equal(calcMedalTier(5, { bronze: 10, silver: 50, gold: 200, platinum: 1000 }), "Nessuno");
assert.deepEqual(parseCsvLine('a,b,"c,d"'), ["a", "b", "c,d"]);
assert.deepEqual(parseCsvLine("Pikachu;100;15;14;13"), ["Pikachu", "100", "15", "14", "13"]);

console.log("All tests passed.");
