#!/usr/bin/env python3
"""Arricchisce pokemon.json con metodi di ottenimento ed evoluzione (dati Pokémon GO)."""

import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
POKEMON_PATH = ROOT / "pokemon.json"
CACHE_PATH = ROOT / "data" / "pogo-pokemon-raw.json"

TYPE_IT = {
    "Normal": "Normale", "Fighting": "Lotta", "Flying": "Volante", "Poison": "Veleno",
    "Ground": "Terra", "Rock": "Roccia", "Bug": "Coleottero", "Ghost": "Spettro",
    "Steel": "Acciaio", "Fire": "Fuoco", "Water": "Acqua", "Grass": "Erba",
    "Electric": "Elettro", "Psychic": "Psico", "Ice": "Ghiaccio", "Dragon": "Drago",
    "Dark": "Buio", "Fairy": "Folletto",
}

ITEM_IT = {
    "Sun Stone": "Pietrasolare",
    "Kings Rock": "Roccia di Re",
    "Metal Coat": "Metalcopertura",
    "Dragon Scale": "Squama Drago",
    "Up Grade": "Upgrade",
    "Gen4 Evolution Stone": "Pietra Sinnoh",
    "Gen5 Evolution Stone": "Pietra Unima",
    "Mossy Lure Module": "Modulo esca muschiata",
    "Glacial Lure Module": "Modulo esca glaciale",
    "Magnetic Lure Module": "Modulo esca magnetica",
    "Rainy Lure Module": "Modulo esca piovosa",
}

QUEST_IT = {
    "ESPEON_EVOLUTION_QUEST": "essere buddy di giorno con cuori",
    "UMBREON_EVOLUTION_QUEST": "essere buddy di notte con cuori",
    "SYLVEON_EVOLUTION_QUEST": "buddy con cuori + mossa Folletto",
    "AERODACTYL_EVOLUTION_QUEST": "completare ricerca Aerodactyl",
    "YAMASK_EVOLUTION_QUEST": "camminare 10 km come buddy",
}

LURE_IT = {
    "Mossy Lure Module": "Modulo esca muschiata attivo",
    "Glacial Lure Module": "Modulo esca glaciale attivo",
    "Magnetic Lure Module": "Modulo esca magnetica attivo",
    "Rainy Lure Module": "Modulo esca piovosa attivo",
}

WEATHER_IT = {
    "Clear": "Sereno",
    "Rainy": "Pioggia",
    "Partly Cloudy": "Parzialmente nuvoloso",
    "Overcast": "Nuvoloso",
    "Windy": "Ventoso",
    "Snow": "Neve",
    "Fog": "Nebbia",
}


def fetch_json(url, cache_file=None):
    if cache_file and cache_file.exists():
        return json.loads(cache_file.read_text(encoding="utf-8"))
    req = urllib.request.Request(url, headers={"User-Agent": "pokemon-go-tracker-build/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read())
    if cache_file:
        cache_file.parent.mkdir(parents=True, exist_ok=True)
        cache_file.write_text(json.dumps(data), encoding="utf-8")
    return data


def load_sources():
    go_pokemon = fetch_json(
        "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/pokemon.json",
        CACHE_PATH,
    )
    items = fetch_json(
        "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/items.json",
    )
    types = fetch_json(
        "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/types.json",
        ROOT / "data" / "pogo-types.json",
    )
    weather = fetch_json(
        "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/weather.json",
        ROOT / "data" / "pogo-weather.json",
    )
    pogo_evo = fetch_json(
        "https://pogoapi.net/api/v1/pokemon_evolutions.json",
        ROOT / "data" / "pogo-evolutions.json",
    )
    item_map = {i["itemId"]: ITEM_IT.get(i["itemName"], i["itemName"]) for i in items}
    type_map = {t["typeId"]: TYPE_IT.get(t["typeName"], t["typeName"]) for t in types}
    evo_extra = {}
    for entry in pogo_evo:
        evo_extra[entry["pokemon_id"]] = entry.get("evolutions", [])
    return go_pokemon, item_map, type_map, types, weather, evo_extra


def calc_type_matchups(defender_type_ids, types_data, type_map):
    type_by_id = {t["typeId"]: t for t in types_data}
    weak, double_weak, resist, double_resist = [], [], [], []

    for atk_id, atk_name in type_map.items():
        if atk_id == 0:
            continue
        mult = 1.0
        for def_id in defender_type_ids:
            t = type_by_id.get(def_id, {})
            if atk_id in t.get("immunes", []):
                mult *= 0.390625
            elif atk_id in t.get("resistances", []):
                mult *= 0.625
            elif atk_id in t.get("weaknesses", []):
                mult *= 1.6

        if mult >= 2.5:
            double_weak.append(atk_name)
        elif mult > 1.05:
            weak.append(atk_name)
        elif mult <= 0.42:
            double_resist.append(atk_name)
        elif mult < 0.95:
            resist.append(atk_name)

    return {
        "weak": weak,
        "doubleWeak": double_weak,
        "resist": resist,
        "doubleResist": double_resist,
    }


def calc_weather_boosts(defender_type_ids, weather_data, type_map):
    boosts = []
    for w in weather_data:
        if not w.get("types"):
            continue
        matched = [type_map[t] for t in w["types"] if t in defender_type_ids and t in type_map]
        if matched:
            boosts.append({
                "weather": WEATHER_IT.get(w["weatherName"], w["weatherName"]),
                "types": matched,
            })
    return boosts


def format_evo_method(evo, item_map, pogo_evos_for_target):
    parts = []
    candy = evo.get("candyCost") or evo.get("candy_required")
    if candy:
        parts.append(f"{candy} caramelle")

    item_id = evo.get("itemRequirement")
    if item_id and item_id in item_map:
        parts.append(item_map[item_id])

    item_name = evo.get("item_required")
    if item_name:
        parts.append(ITEM_IT.get(item_name, item_name))

    lure = evo.get("lure_required")
    if lure:
        parts.append(LURE_IT.get(lure, f"con {lure}"))

    if evo.get("tradeBonus") or evo.get("no_candy_cost_if_traded"):
        parts.append("scambio senza caramelle")

    quest = evo.get("questRequirement") or evo.get("quest_requirement")
    if quest:
        parts.append(QUEST_IT.get(quest, quest.replace("_", " ").lower()))
    elif evo.get("mustBeBuddy") or evo.get("must_be_buddy_to_evolve"):
        dist = evo.get("buddy_distance_required") or evo.get("buddyDistance")
        if evo.get("onlyDaytime") or evo.get("only_evolves_in_daytime"):
            parts.append("buddy di giorno" + (f" + {dist:g} km" if dist else ""))
        elif evo.get("onlyNighttime") or evo.get("only_evolves_in_nighttime"):
            parts.append("buddy di notte" + (f" + {dist:g} km" if dist else ""))
        elif dist:
            parts.append(f"buddy + {dist:g} km camminati")
        else:
            parts.append("essere buddy")
    else:
        if evo.get("onlyDaytime") or evo.get("only_evolves_in_daytime"):
            parts.append("solo di giorno")
        if evo.get("onlyNighttime") or evo.get("only_evolves_in_nighttime"):
            parts.append("solo di notte")

    gender = evo.get("genderRequirement") or evo.get("gender_required")
    if gender == 1:
        parts.append("solo maschio")
    elif gender == 2:
        parts.append("solo femmina")

    if evo.get("upside_down"):
        parts.append("con schermo capovolto")

    target_id = evo.get("evoId") or evo.get("pokemon_id")
    if pogo_evos_for_target:
        for pe in pogo_evos_for_target:
            if pe.get("pokemon_id") == target_id:
                if pe.get("lure_required") and not any("esca" in x for x in parts):
                    parts.append(LURE_IT.get(pe["lure_required"], pe["lure_required"]))

    cleaned = []
    seen = set()
    for part in parts:
        key = part.lower()
        if key not in seen:
            seen.add(key)
            cleaned.append(part)
    return " + ".join(cleaned) if cleaned else "metodo speciale"


def build_obtain(go, predecessors, it_name):
    pid = go["pokedexId"]
    methods = []

    if go.get("mythic"):
        methods.append("Ricerca speciale o evento GO")
    if go.get("ultraBeast"):
        methods.append("Raid Ultracreatura (rotazione)")
    if go.get("legendary"):
        methods.append("Raid leggendario (rotazione)")

    if go.get("tempEvolutions"):
        methods.append("Megaevoluzione (Energia Mega da raid/eventi)")

    for pre_id, pre_name in predecessors:
        methods.append(f"Evoluzione da {pre_name}")

    is_basic = not predecessors and go.get("evolutions")
    wild_ok = not go.get("legendary") and not go.get("mythic") and not go.get("ultraBeast")

    if is_basic or (not predecessors and wild_ok):
        extras = [
            "Selvatico",
            "Uova (pool stagionale)",
            "Ricerca sul campo",
            "Eventi / Community Day",
        ]
        for e in extras:
            if e not in methods:
                methods.append(e)

    if not methods:
        if predecessors and not go.get("evolutions"):
            methods.append("Solo evoluzione")
        else:
            methods.append("Disponibilità variabile (eventi/rotazioni)")

    # dedupe preserving order
    seen = set()
    out = []
    for m in methods:
        if m not in seen:
            seen.add(m)
            out.append(m)
    return out


def build_pokemon_data():
    base = json.loads(POKEMON_PATH.read_text(encoding="utf-8"))
    it_names = {p["id"]: p["name"] for p in base}
    go_pokemon, item_map, type_map, types_data, weather_data, evo_extra = load_sources()
    go_by_id = {p["pokedexId"]: p for p in go_pokemon}

    predecessors = {i: [] for i in range(1, 1026)}
    evo_methods_from = {}

    for go in go_pokemon:
        pid = go["pokedexId"]
        for evo in go.get("evolutions", []):
            tgt = evo["evoId"]
            predecessors[tgt].append((pid, it_names.get(pid, go["pokemonName"])))
            pogo_target = evo_extra.get(pid, [])
            method = format_evo_method(evo, item_map, pogo_target)
            evo_methods_from.setdefault(tgt, []).append({
                "fromId": pid,
                "fromName": it_names.get(pid, go["pokemonName"]),
                "how": method,
            })

    enriched = []
    for p in base:
        pid = p["id"]
        go = go_by_id.get(pid, {})
        type_ids = [t for t in go.get("types", []) if t]
        types = [type_map.get(t, "?") for t in type_ids]
        matchups = calc_type_matchups(type_ids, types_data, type_map)
        weather_boosts = calc_weather_boosts(type_ids, weather_data, type_map)

        evolves_to = []
        for evo in go.get("evolutions", []):
            tgt = evo["evoId"]
            method = format_evo_method(evo, item_map, evo_extra.get(pid, []))
            evolves_to.append({
                "id": tgt,
                "name": it_names.get(tgt, str(tgt)),
                "how": method,
            })

        evolves_from = evo_methods_from.get(pid, [])
        obtain = build_obtain(go, predecessors.get(pid, []), p["name"])

        entry = {
            **p,
            "types": types,
            "obtain": obtain,
            "evolvesTo": evolves_to,
            "evolvesFrom": evolves_from,
            "buddyKm": go.get("buddyDistance"),
            "legendary": bool(go.get("legendary")),
            "mythic": bool(go.get("mythic")),
            "weatherBoosts": weather_boosts,
            "weaknesses": matchups,
        }
        enriched.append(entry)

    POKEMON_PATH.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    return enriched


if __name__ == "__main__":
    data = build_pokemon_data()
    print(f"Aggiornato {POKEMON_PATH} ({len(data)} specie con ottenimento/evoluzione/meteo/tipi)")
