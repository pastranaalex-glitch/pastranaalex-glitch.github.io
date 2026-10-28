#!/usr/bin/env python3
"""Recuenta descargas reales de activos de GitHub Releases para la Biblioteca."""
from __future__ import annotations
import datetime as dt
import json
import os
from pathlib import Path
import re
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SHARED = "pastranaalex-glitch/pastranaalex-glitch.github.io"
API = "https://api.github.com"
RULES = {
    "jardin-de-joyas": r"^Jardin[_-]de[_-]Joyas(?:[._-]|[0-9])",
    "mente-activa-pro": r"^Mente[_-]Activa[_-]PRO(?:[._-]|[0-9])",
    "sudoku-vivo": r"^SudokuVivo_[0-9].*\.apk$",
    "sopa-de-letras-pro": r"^Sopa[_-]de[_-]Letras[_-]PRO[_-][0-9].*\.apk$",
    "en-familia": r"^En[_-]Familia(?:[._-]|[0-9])",
    "mi-salud-familiar": r"^Mi[_-]?Salud[_-]?Familiar(?:[._-]|[0-9])",
    "menu-y-compra": r"^Menu[_-]y[_-]Compra(?:[._-]|[0-9])",
    "mi-dinero-real": r"^MiDineroReal2_[0-9].*\.apk$",
    "rutas-a-pie": r"^RutasAPie(?:[._-]|[0-9])",
}

def releases(repo: str) -> list[dict]:
    result = []
    token = os.getenv("GH_TOKEN") or os.getenv("GITHUB_TOKEN", "")
    for page in range(1, 31):
        url = f"{API}/repos/{repo}/releases?per_page=100&page={page}"
        headers = {"Accept": "application/vnd.github+json", "User-Agent": "biblioteca-descargas/1.0"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=35) as response:
            batch = json.load(response)
        if not isinstance(batch, list):
            raise RuntimeError(f"GitHub no devolvió una lista de releases: {repo}")
        result.extend(batch)
        if len(batch) < 100:
            return result
    raise RuntimeError(f"Más de 3000 releases: {repo}; recuento no completo")

def belongs(app: dict, repo: str, asset: dict) -> bool:
    name = asset.get("name", "")
    if not isinstance(name, str) or asset.get("state") != "uploaded":
        return False
    if re.search(r"debug|unsigned|sin[._-]?firmar", name, re.I):
        return False
    platform = app.get("plataforma")
    if not re.search(r"\.apk$" if platform == "android" else r"\.(?:exe|msi|zip)$", name, re.I):
        return False
    url = asset.get("browser_download_url", "")
    if not isinstance(url, str) or not url.startswith(f"https://github.com/{repo}/releases/download/"):
        return False
    if repo == SHARED:
        pattern = RULES.get(app["slug"])
        return bool(pattern and re.search(pattern, name, re.I))
    return repo == app.get("repo")

def main() -> None:
    catalog = json.loads((ROOT / "catalogo.json").read_text(encoding="utf-8"))
    path = ROOT / "descargas-acumuladas.json"
    previous = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    old_counts = previous.get("conteos", {})
    old_assets = previous.get("activos", {})
    apps = [a for a in catalog.get("aplicaciones", [])
            if a.get("publicado") is True and a.get("plataforma") in ("android", "windows")
            and isinstance(a.get("repo"), str) and re.fullmatch(r"[a-z0-9-]+", a.get("slug", ""))]
    repos = {a["repo"] for a in apps}
    if any(a["slug"] == "rutas-a-pie" for a in apps):
        repos.add(SHARED)
    # Se exige respuesta de todos los repositorios antes de alterar el respaldo.
    sources = {repo: releases(repo) for repo in sorted(repos)}
    conteos = {k: v for k, v in old_counts.items() if isinstance(v, int) and v >= 0}
    activos = {k: dict(v) for k, v in old_assets.items() if isinstance(v, dict)}
    for app in apps:
        slug = app["slug"]
        repos_for_app = [app["repo"]]
        if slug == "rutas-a-pie" and SHARED not in repos_for_app:
            repos_for_app.append(SHARED)
        history = {key: value for key, value in activos.get(slug, {}).items()
                   if isinstance(value, int) and value >= 0}
        found = False
        for repo in repos_for_app:
            for release in sources[repo]:
                if release.get("draft") is True:
                    continue
                for asset in release.get("assets", []):
                    if not belongs(app, repo, asset):
                        continue
                    key = f"{repo}:{asset.get('id', release.get('tag_name', '') + ':' + asset['name'])}"
                    n = asset.get("download_count")
                    if not isinstance(n, int) or n < 0:
                        continue
                    found = True
                    history[key] = max(history.get(key, 0), n)
        if found or history or slug in conteos:
            # Preservar mínimos históricos aunque se retire una versión.
            conteos[slug] = max(conteos.get(slug, 0), sum(history.values()))
            activos[slug] = dict(sorted(history.items()))
            print(f"{slug}: {conteos[slug]} descargas confirmadas")
    now = dt.datetime.now(dt.timezone.utc)
    result = {
        "fecha": now.date().isoformat(),
        "actualizado": now.isoformat(timespec="seconds"),
        "descripcion": "Mínimos de descargas de archivos publicados en GitHub Releases; no son instalaciones ni personas únicas y no incluyen archivos descargados directamente desde GitHub Pages.",
        "conteos": dict(sorted(conteos.items())),
        "activos": dict(sorted(activos.items()))
    }
    path.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()
