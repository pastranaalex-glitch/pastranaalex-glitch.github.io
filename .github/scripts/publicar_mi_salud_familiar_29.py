#!/usr/bin/env python3
"""Publica Mi Salud Familiar 2.9 solo si el APK exacto existe y coincide."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
from datetime import datetime
from zoneinfo import ZoneInfo

REPO = "pastranaalex-glitch/pastranaalex-glitch.github.io"
TAG = "mi-salud-familiar-v2.9"
APK = "MiSaludFamiliar_2.9_Publicacion_Firmada.apk"
EXPECTED_SHA256 = "bc749053460064f8a85c9d6bf1af5ef1b4ac34a532e6fc915c3bda4dd276d749"
START = datetime(2026, 10, 18, 0, 0, tzinfo=ZoneInfo("Europe/Madrid"))
URL = "https://github.com/" + REPO + "/releases/download/" + TAG + "/" + APK

def command(*args):
    return subprocess.run(args, text=True, capture_output=True, check=True)

def main():
    if os.getenv("GITHUB_REPOSITORY") != REPO:
        raise RuntimeError("Repositorio incorrecto.")
    if datetime.now(ZoneInfo("Europe/Madrid")) < START:
        print("Aun no ha llegado el momento de publicacion.")
        return

    try:
        result = command("gh", "release", "view", TAG, "--repo", REPO,
                         "--json", "tagName,isDraft,assets")
    except subprocess.CalledProcessError:
        print("Falta crear la release borrador. No se publicara.")
        return
    release = json.loads(result.stdout)
    if release.get("tagName") != TAG:
        raise RuntimeError("Tag inesperado.")
    assets = [item for item in release.get("assets", []) if item.get("name") == APK]
    if len(assets) != 1:
        print("No hay exactamente un APK con el nombre aprobado. No se publicara.")
        return
    with tempfile.TemporaryDirectory() as directory:
        command("gh", "release", "download", TAG, "--repo", REPO,
                "--pattern", APK, "--dir", directory)
        sha = hashlib.sha256(Path(directory, APK).read_bytes()).hexdigest()
        if sha != EXPECTED_SHA256:
            raise RuntimeError("APK NO PUBLICADO: SHA-256 diferente: " + sha)

    if release.get("isDraft"):
        command("gh", "release", "edit", TAG, "--repo", REPO,
                "--draft=false", "--latest=false")
        print("Release de Mi Salud Familiar 2.9 publicada.")

    catalog_path = Path("catalogo.json")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    matched = [app for app in catalog.get("aplicaciones", [])
               if app.get("slug") == "mi-salud-familiar"]
    if len(matched) != 1:
        raise RuntimeError("Ficha de catalogo inexistente o duplicada.")
    entry = matched[0]
    if entry.get("version") != "2.9" or entry.get("repo") != REPO:
        raise RuntimeError("Datos del catalogo inesperados.")
    entry["publicado"] = True
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
                            encoding="utf-8")

    html_path = Path("mi-salud-familiar.html")
    html = html_path.read_text(encoding="utf-8")
    html = html.replace('content="noindex,nofollow"', 'content="index,follow"')
    html = html.replace(
        '<span class="pending">APK definitivo pendiente de publicación</span>',
        '<a class="pending" style="background:#087f70;color:white;text-decoration:none" href="'
        + URL + '" rel="noopener noreferrer">↓ Descargar APK gratis · 2.9</a>')
    html = html.replace(
        "Esta ficha está preparada, pero el APK no se ofrecerá hasta contar con una versión de publicación firmada y comprobada.",
        "Descarga gratuita del APK firmado Mi Salud Familiar 2.9.")
    html_path.write_text(html, encoding="utf-8")

    upcoming_path = Path("proximas-apps.json")
    upcoming = json.loads(upcoming_path.read_text(encoding="utf-8"))
    for item in upcoming.get("aplicaciones", []):
        if item.get("slug") == "mi-salud-familiar":
            item["repo"] = REPO
            item["versionAprobada"] = "2.9"
            item["revisionAprobada"] = True
            item["publicacionAutomatica"] = True
    upcoming_path.write_text(json.dumps(upcoming, ensure_ascii=False, indent=2) + "\n",
                             encoding="utf-8")

    status = command("git", "status", "--porcelain").stdout
    if status.strip():
        command("git", "config", "user.name", "github-actions[bot]")
        command("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
        command("git", "add", "catalogo.json", "mi-salud-familiar.html", "proximas-apps.json")
        command("git", "commit", "-m", "Publicar Mi Salud Familiar 2.9 tras verificar APK")
        command("git", "push", "origin", "HEAD:main")
        # El GITHUB_TOKEN no inicia por si mismo otra compilacion de Pages.
        try:
            command("gh", "api", "-X", "POST", "repos/" + REPO + "/pages/builds")
            print("Reconstruccion de GitHub Pages solicitada.")
        except subprocess.CalledProcessError as error:
            print("AVISO: Pages no ha aceptado la peticion de reconstruccion:", error.stderr)

    print("Ficha actualizada y descarga comprobada:", URL)

if __name__ == "__main__":
    main()
