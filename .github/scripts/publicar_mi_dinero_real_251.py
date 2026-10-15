#!/usr/bin/env python3
"""Estreno programado de Mi Dinero Real 2 con SHA-256, sin subir de nuevo la APK."""
import hashlib
import json
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

NAME = "MiDineroReal2_2.5.1_Publicacion_Firmada.apk"
EXPECTED = "c7f35b29e0fa46ccf91c349ca53360dd9c204f988eabcf8c6eed3a30eff9d69c"
TARGET = datetime(2026, 10, 21, 0, 0, tzinfo=ZoneInfo("Europe/Madrid"))
PENDING = '<span class="fin-button fin-primary" aria-disabled="true">Disponible el 21 de octubre de 2026</span>'
READY = '<a class="fin-button fin-primary" href="' + NAME + '" download="' + NAME + '">↓ Descargar APK firmada</a>'

def publish(root, now):
    configuration = json.loads((root / "proximas-apps.json").read_text(encoding="utf-8"))
    matches = [a for a in configuration.get("aplicaciones", []) if a.get("slug") == "mi-dinero-real"]
    if len(matches) != 1:
        raise RuntimeError("La configuración del estreno no es válida")
    app = matches[0]
    checks = {
        "fechaEstreno": "2026-10-21T00:00:00+02:00",
        "repo": "pastranaalex-glitch/pastranaalex-glitch.github.io",
        "versionAprobada": "2.5.1",
        "publicacionAutomatica": True,
        "revisionAprobada": True,
        "sha256Aprobado": EXPECTED
    }
    if any(app.get(key) != value for key, value in checks.items()):
        raise RuntimeError("Fecha o aprobación diferentes de la versión validada")
    apk = root / NAME
    if not apk.is_file():
        raise RuntimeError("La APK ya subida no está disponible")
    digest = hashlib.sha256()
    with apk.open("rb") as stream:
        for piece in iter(lambda: stream.read(1048576), b""):
            digest.update(piece)
    if digest.hexdigest() != EXPECTED:
        raise RuntimeError("La APK ha cambiado: no se activa la descarga")
    if now.astimezone(ZoneInfo("Europe/Madrid")) < TARGET:
        print("APK comprobada, fecha de estreno aún no alcanzada")
        return False

    catalog_path = root / "catalogo.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    items = [a for a in catalog.get("aplicaciones", []) if a.get("slug") == "mi-dinero-real"]
    if len(items) != 1 or items[0].get("version") != "2.5.1":
        raise RuntimeError("Entrada del catálogo incorrecta")
    if items[0].get("publicado") is True:
        print("La publicación ya se ha completado")
        return False

    detail_path = root / "mi-dinero-real.html"
    detail = detail_path.read_text(encoding="utf-8")
    if PENDING not in detail or 'content="noindex,nofollow"' not in detail:
        raise RuntimeError("La ficha pendiente no tiene el formato esperado")
    upcoming_path = root / "proximamente.html"
    upcoming = upcoming_path.read_text(encoding="utf-8")
    begin = upcoming.find('<article class="pack6-project-card pack6-project-finance" data-proxima="mi-dinero-real">')
    end = upcoming.find("</article>", begin)
    if begin < 0 or end < 0:
        raise RuntimeError("Anuncio de Próximamente no encontrado")

    items[0]["publicado"] = True
    catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    detail_path.write_text(detail.replace(PENDING, READY).replace('content="noindex,nofollow"', 'content="index,follow"').replace(
        "Estreno automático previsto para el 21 de octubre de 2026 a las 00:00, hora de Madrid.",
        "Descarga directa desde la Biblioteca, gratis y sin suscripciones."
    ), encoding="utf-8")
    upcoming_path.write_text(upcoming[:begin] + upcoming[end + len("</article>"):], encoding="utf-8")
    home_path = root / "index.html"
    home = home_path.read_text(encoding="utf-8")
    home_path.write_text(home.replace("Menú y Compra, Mi Salud Familiar, Mi Dinero Real 2 y Voz a Texto PRO",
                                       "Menú y Compra, Mi Salud Familiar y Voz a Texto PRO"), encoding="utf-8")
    sitemap_path = root / "sitemap.xml"
    sitemap = sitemap_path.read_text(encoding="utf-8")
    if "mi-dinero-real.html" not in sitemap:
        row = '  <url><loc>https://pastranaalex-glitch.github.io/mi-dinero-real.html</loc><lastmod>2026-10-21</lastmod></url>\n'
        sitemap_path.write_text(sitemap.replace("</urlset>", row + "</urlset>"), encoding="utf-8")
    print("Mi Dinero Real 2.5.1 publicada automáticamente")
    return True

if __name__ == "__main__":
    publish(Path(__file__).resolve().parents[2], datetime.now(ZoneInfo("Europe/Madrid")))
