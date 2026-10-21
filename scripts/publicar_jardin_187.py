#!/usr/bin/env python3
"""Activa el Pack 37 en la web cuando su APK pública coincide con la aprobada.

No crea Releases, no sube ni recompila APK y no envía correos.
"""
import hashlib
import json
import os
from pathlib import Path
import re
from urllib.error import HTTPError
from urllib.request import Request, urlopen

REPO = "pastranaalex-glitch/pastranaalex-glitch.github.io"
SLUG = "jardin-de-joyas"
VERSION = "1.8.7"
TAG = "jardin-de-joyas-v1.8.7"
FILENAME = "Jardin_de_Joyas_1_8_7_PACK37_FIRMA_EXISTENTE.apk"
SHA256 = "47f59f813cdddd8d579e840081d27a8a5b2de134ad6876b3241d510f3fe6004a"
SIZE = 72213566
DOWNLOAD = f"https://github.com/{REPO}/releases/download/{TAG}/{FILENAME}"
PREVIOUS_TAG = "jardin-de-joyas-v1.8.6"
DESCRIPTION = ("Juego gratuito sin anuncios con 200 niveles, tablero ampliado, modo Relax, "
               "ocho melodías relajantes y progreso visible para Flores de Oro y semillas especiales. "
               "Jardín Vivo, combos mejorados y estadísticas opcionales.")


def get_release():
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "Biblioteca-Jardin-Pack37"}
    if os.getenv("GH_TOKEN"):
        headers["Authorization"] = "Bearer " + os.environ["GH_TOKEN"]
    request = Request(f"https://api.github.com/repos/{REPO}/releases/tags/{TAG}", headers=headers)
    try:
        with urlopen(request, timeout=25) as response:
            return json.load(response)
    except HTTPError as error:
        if error.code == 404:
            return None
        raise


def approved_asset(release):
    if (not release or release.get("draft") is not False
            or release.get("prerelease") is not False or release.get("tag_name") != TAG):
        return None
    matches = [a for a in release.get("assets", []) if a.get("name") == FILENAME]
    if len(matches) != 1:
        return None
    asset = matches[0]
    if (asset.get("state") != "uploaded" or asset.get("size") != SIZE
            or asset.get("browser_download_url") != DOWNLOAD
            or asset.get("digest") not in (None, "sha256:" + SHA256)):
        return None
    return asset


def verify_asset(asset):
    """Comprueba los bytes públicos incluso si GitHub ya proporciona un digest."""
    digest = hashlib.sha256()
    size = 0
    request = Request(asset["browser_download_url"], headers={"User-Agent": "Biblioteca-Jardin-Pack37"})
    with urlopen(request, timeout=45) as response:
        while chunk := response.read(1048576):
            size += len(chunk)
            if size > SIZE:
                raise ValueError("La APK pública supera el tamaño aprobado")
            digest.update(chunk)
    if size != SIZE or digest.hexdigest() != SHA256:
        raise ValueError("La APK pública no coincide con el Pack 37 aprobado")


def replace_one(text, pattern, replacement):
    result, count = re.subn(pattern, lambda _: replacement, text, flags=re.S)
    if count != 1:
        raise ValueError("La estructura de la web ha cambiado; revisar antes de publicar")
    return result


def update_detail(text):
    text = text.replace("1.8.6", VERSION).replace(
        "Jardin_de_Joyas_1_8_6_PACK36_FIRMA_EXISTENTE.apk", FILENAME).replace(
        "67e42d3021ea05c192f5473374eb45338827d904a299be66bf6e8629cda21469", SHA256)
    text = replace_one(text,
        r'<a href="https://github.com/pastranaalex-glitch/pastranaalex-glitch.github.io/releases/tag/[^"]+" rel="noopener noreferrer">Versión anterior [^<]+</a>',
        f'<a href="https://github.com/{REPO}/releases/tag/{PREVIOUS_TAG}" rel="noopener noreferrer">Versión anterior 1.8.6</a>')
    if 'id="correccion-tablet-pack37"' not in text:
        text = replace_one(text, r'<ul class="jj-update-list">',
            '<ul class="jj-update-list">\n<li id="correccion-tablet-pack37"><strong>Estadísticas accesibles en tablets.</strong> Los botones «Sí, compartir» y «No compartir» quedan dentro de la pantalla. Texto ajustable y desplazable, botones grandes y diagnóstico adaptado. Puedes cambiar tu elección desde Ajustes.</li>')
    return text


def update_home(text):
    pattern = r'<article class="biblio-news-card biblio-news-card--joyas".*?</article>'
    matches = list(re.finditer(pattern, text, flags=re.S))
    if len(matches) != 1:
        raise ValueError("La estructura de la portada ha cambiado")
    article = matches[0].group().replace("1.8.6", VERSION)
    article = replace_one(article, r'<h3 id="noticia-joyas-titulo">.*?</h3>',
        '<h3 id="noticia-joyas-titulo">Jardín de Joyas: corregido para tablets</h3>')
    article = article.replace(
        "Flores de Oro y semillas con el progreso a la vista, ocho melodías relajantes, joyas más definidas y un tablero más grande.",
        "Ya puedes elegir compartir tu nivel en tablets con los dos botones accesibles. Conserva las ocho melodías, los objetivos de Flores de Oro y semillas y el tablero ampliado.")
    return replace_one(text, pattern, article)


def publish(base):
    config = json.loads((base / "proximas-apps.json").read_text(encoding="utf-8"))
    catalogue = json.loads((base / "catalogo.json").read_text(encoding="utf-8"))
    approved = [a for a in config["aplicaciones"] if a.get("slug") == SLUG]
    current = [a for a in catalogue["aplicaciones"] if a.get("slug") == SLUG]
    if len(approved) != 1 or len(current) != 1:
        raise ValueError("Jardín de Joyas debe tener una única entrada")
    approved, current = approved[0], current[0]
    expected = {"repo": REPO, "versionAprobada": TAG, "versionVisible": VERSION,
                "archivoAprobado": FILENAME, "sha256Aprobado": SHA256,
                "revisionAprobada": True, "publicacionAutomatica": True}
    if any(approved.get(k) != v for k, v in expected.items()):
        print("Jardín Pack 37: la configuración no autoriza esta APK")
        return []
    if current.get("version") not in ("1.8.6", VERSION) or current.get("publicado") is not True:
        print("Jardín Pack 37: se conserva la versión del catálogo")
        return []
    current.update(version=VERSION, disponible=True, estado="Disponible",
                   descarga={"version": VERSION, "tag": TAG, "archivo": FILENAME, "sha256": SHA256})
    approved["apkSubido"] = True
    updated = {
        "catalogo.json": json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n",
        "proximas-apps.json": json.dumps(config, ensure_ascii=False, indent=2) + "\n",
        "jardin-de-joyas.html": update_detail((base / "jardin-de-joyas.html").read_text(encoding="utf-8")),
        "index.html": update_home((base / "index.html").read_text(encoding="utf-8")),
    }
    changes = [n for n, c in updated.items() if (base / n).read_text(encoding="utf-8") != c]
    if not changes:
        print("Jardín Pack 37: la web ya está actualizada")
        return []
    asset = approved_asset(get_release())
    if asset is None:
        print("Jardín Pack 37: esperando la Release pública con la APK aprobada")
        return []
    verify_asset(asset)
    for name in changes:
        (base / name).write_text(updated[name], encoding="utf-8")
    print("Jardín Pack 37 verificado. Actualizados:", ", ".join(changes))
    return changes


if __name__ == "__main__":
    publish(Path(__file__).resolve().parents[1])

