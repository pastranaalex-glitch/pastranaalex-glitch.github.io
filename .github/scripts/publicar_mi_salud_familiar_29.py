#!/usr/bin/env python3
"""Prepara y publica Mi Salud Familiar 2.9 únicamente con su APK verificado."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
from datetime import datetime
from zoneinfo import ZoneInfo

REPO = "pastranaalex-glitch/pastranaalex-glitch.github.io"
TAG = "mi-salud-familiar-v2.9"
APK = "MiSaludFamiliar_2.9_Publicacion_Firmada.apk"
EXPECTED_SHA256 = "bc749053460064f8a85c9d6bf1af5ef1b4ac34a532e6fc915c3bda4dd276d749"
START = datetime(2026, 10, 18, 0, 0, tzinfo=ZoneInfo("Europe/Madrid"))
URL = f"https://github.com/{REPO}/releases/download/{TAG}/{APK}"

def command(*args):
    return subprocess.run(args, check=True, text=True, capture_output=True)

def publish_pages():
    try:
        command("gh", "api", "-X", "POST", f"repos/{REPO}/pages/builds")
        print("Actualizacion de GitHub Pages solicitada.")
    except subprocess.CalledProcessError as error:
        print("AVISO: No ha sido posible solicitar Pages:", error.stderr)

def save_changes(*paths):
    if not command("git", "status", "--porcelain").stdout.strip():
        return
    command("git", "config", "user.name", "github-actions[bot]")
    command("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
    command("git", "add", *paths)
    staged = command("git", "diff", "--cached", "--name-only").stdout.strip()
    if not staged:
        return
    command("git", "commit", "-m", "Actualizar estado verificado de publicación Mi Salud Familiar 2.9")
    command("git", "push", "origin", "HEAD:main")
    publish_pages()

def verify_release():
    try:
        response = command("gh", "release", "view", TAG, "--repo", REPO,
                           "--json", "tagName,isDraft,assets")
    except subprocess.CalledProcessError:
        print("Aún no existe la release borrador de Mi Salud Familiar 2.9.")
        return None
    release = json.loads(response.stdout)
    if release.get("tagName") != TAG:
        raise RuntimeError("El identificador de la release no coincide.")
    assets = [asset for asset in release.get("assets", [])
              if asset.get("name") == APK]
    if len(assets) != 1:
        print("Pendiente: falta el APK exacto en la release borrador.")
        return None
    with tempfile.TemporaryDirectory() as tmp:
        command("gh", "release", "download", TAG, "--repo", REPO,
                "--pattern", APK, "--dir", tmp)
        digest = hashlib.sha256()
        with Path(tmp, APK).open("rb") as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(chunk)
        if digest.hexdigest() != EXPECTED_SHA256:
            raise RuntimeError("La release contiene un APK distinto. No se publicará.")
    return release

def mark_ready():
    path = Path("proximas-apps.json")
    cfg = json.loads(path.read_text(encoding="utf-8"))
    matches = [a for a in cfg.get("aplicaciones", [])
               if a.get("slug") == "mi-salud-familiar"]
    if len(matches) != 1:
        raise RuntimeError("Configuración de Mi Salud Familiar ausente o duplicada.")
    app = matches[0]
    if app.get("fechaEstreno") != "2026-10-18T00:00:00+02:00":
        raise RuntimeError("Fecha de estreno modificada inesperadamente.")
    app.update({
        "repo": REPO,
        "versionAprobada": "2.9",
        "revisionAprobada": True,
        "publicacionAutomatica": True
    })
    path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")

def publish_catalog():
    catalog_path = Path("catalogo.json")
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    found = [a for a in catalog.get("aplicaciones", [])
             if a.get("slug") == "mi-salud-familiar"]
    if len(found) != 1 or found[0].get("version") != "2.9" or found[0].get("repo") != REPO:
        raise RuntimeError("El catálogo no coincide con Mi Salud Familiar 2.9.")
    found[0]["publicado"] = True
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
                            encoding="utf-8")

    detail_path = Path("mi-salud-familiar.html")
    html = detail_path.read_text(encoding="utf-8")
    html = html.replace('content="noindex,nofollow"', 'content="index,follow"')
    html = html.replace(
        '<span class="pending">APK definitivo pendiente de publicación</span>',
        '<a class="pending" style="background:#087f70;color:white;text-decoration:none" '
        f'href="{URL}" rel="noopener noreferrer">↓ Descargar APK gratis · 2.9</a>')
    html = html.replace(
        "Esta ficha está preparada, pero el APK no se ofrecerá hasta contar con una versión de publicación firmada y comprobada.",
        "Descarga gratuita del APK firmado Mi Salud Familiar 2.9.")
    if URL not in html:
        raise RuntimeError("No se ha podido insertar el enlace de descarga correcto.")
    detail_path.write_text(html, encoding="utf-8")

def main():
    if os.getenv("GITHUB_REPOSITORY") != REPO:
        raise RuntimeError("Repositorio no autorizado.")
    now = datetime.now(ZoneInfo("Europe/Madrid"))
    release = verify_release()
    if release is None:
        print("La automatización queda a la espera del APK en GitHub.")
        return

    if now < START:
        if not release.get("isDraft"):
            raise RuntimeError("La release se ha hecho pública antes de la fecha prevista.")
        mark_ready()
        save_changes("proximas-apps.json")
        print("APK verificado y lanzamiento programado. Luz verde activada.")
        return

    # Revalidación criptográfica antes de la publicación efectiva.
    if release.get("isDraft"):
        command("gh", "release", "edit", TAG, "--repo", REPO,
                "--draft=false", "--latest=false")
    mark_ready()
    publish_catalog()
    save_changes("proximas-apps.json", "catalogo.json", "mi-salud-familiar.html")
    print("Publicación completada:", URL)

if __name__ == "__main__":
    main()
