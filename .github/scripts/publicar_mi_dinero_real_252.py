#!/usr/bin/env python3
"""Activa Mi Dinero Real 2.5.2 solo tras comprobar su APK firmada ya subida.
No compila, firma ni modifica el archivo APK.
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILE = "MiDineroReal2_2_5_2_FIRMA_PERMANENTE.apk"
SHA256 = "d0d3e6c0e42b42c956e0e5227bb5bfde35b21c2175324906a71c986d6398ea16"
URL = "https://pastranaalex-glitch.github.io/" + FILE

def edit(path: str, fn):
    dest = ROOT / path
    old = dest.read_text(encoding="utf-8")
    new = fn(old)
    if not new:
        raise RuntimeError("Resultado vacio al editar " + path)
    if new != old:
        dest.write_text(new, encoding="utf-8")

def json_edit(path: str, fn):
    def update(raw):
        data = json.loads(raw)
        fn(data)
        return json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    edit(path, update)

def catalog(data):
    items = [a for a in data["aplicaciones"] if a.get("slug") == "mi-dinero-real"]
    if len(items) != 1:
        raise RuntimeError("No se encuentra la aplicacion o hay duplicados")
    app = items[0]
    app.update({
        "publicado": True,
        "version": "2.5.2",
        "disponible": True,
        "descargasBloqueadas": False,
        "visibleEnCatalogo": True,
        "estado": "Disponible",
        "etiqueta": "ECONOMÍA DEL HOGAR",
        "descripcion": "Controla ingresos, gastos, alimentación y presupuestos. Incluye análisis, informes y avisos de nuevas versiones. Gratis y sin anuncios.",
        "descargaDirecta": {"version": "2.5.2", "archivo": FILE, "sha256": SHA256}
    })

def updates(data):
    data.update({
        "paquete": "com.alex.midineroreal",
        "disponible": True,
        "versionCode": 9,
        "versionName": "2.5.2",
        "apkUrl": URL,
        "sha256": SHA256,
        "notas": "Versión 2.5.2 disponible: avisos de actualización integrados y mejoras de estabilidad."
    })

def upcoming(data):
    for app in data.get("aplicaciones", []):
        if app.get("slug") == "mi-dinero-real":
            app.update({
                "versionAprobada": "2.5.2",
                "revisionAprobada": True,
                "publicacionAutomatica": False,
                "apkSubido": True,
                "sha256Aprobado": SHA256,
                "descargaBloqueada": False,
                "descargasBloqueadas": False,
                "motivoBloqueo": "",
                "descripcion": "Mi Dinero Real 2.5.2 publicada y disponible en el catálogo."
            })
            break

def pack6(html):
    html = html.replace("MiDineroReal2_2.5.1_Publicacion_Firmada.apk", FILE)
    html = html.replace("c7f35b29e0fa46ccf91c349ca53360dd9c204f988eabcf8c6eed3a30eff9d69c", SHA256)
    return html

def detail(html):
    html = html.replace('content="noindex,follow"', 'content="index,follow"')
    html = html.replace('softwareVersion":"2.5.1"', 'softwareVersion":"2.5.2"')
    html = html.replace('Versión 2.5.1', 'Versión 2.5.2')
    html = html.replace('Android · Finanzas domésticas · En reparación',
                        'Android · Finanzas domésticas · Disponible')
    html = re.sub(r'<p class="fin-repair-banner" role="status">.*?</p>\\n',
                  '', html, count=1, flags=re.S)
    html = re.sub(r'<p class="fin-repair-banner" role="status">.*?</p>\n',
                  '', html, count=1, flags=re.S)
    html = html.replace('Funciona sin Internet', 'Datos económicos guardados en el móvil')
    html = html.replace(
        '<span class="fin-button fin-primary" role="status" aria-disabled="true" style="background:#64748b;cursor:not-allowed">Descarga temporalmente suspendida</span>',
        '<a class="fin-button fin-primary" href="' + FILE + '" download="' + FILE + '">⬇ Descargar Mi Dinero Real 2.5.2</a>'
    )
    html = html.replace(
        'La descarga está suspendida temporalmente. La ficha permanece disponible como información del proyecto.',
        'Versión 2.5.2 probada y firmada para Android. Descarga gratuita y sin anuncios.'
    )
    html = html.replace(
        '<strong>Publicación suspendida:</strong> Mi Dinero Real 2 no está disponible para descarga en este momento. Estamos revisando la aplicación antes de volver a distribuirla.',
        '<strong>Descarga oficial:</strong> descarga Mi Dinero Real 2.5.2 directamente desde esta Biblioteca.'
    )
    html = html.replace(
        'Cuando se reactive la publicación, utiliza exclusivamente el enlace indicado en esta ficha.',
        'Pulsa el botón de descarga de la versión 2.5.2 que aparece al principio de esta ficha.'
    )
    html = html.replace(
        'Mi Dinero Real 2 guarda los datos económicos en el dispositivo y no solicita permiso de Internet.',
        'Mi Dinero Real 2 guarda los datos económicos en el dispositivo. Utiliza Internet para comprobar nuevas versiones, sin subir tus movimientos económicos.'
    )
    html = html.replace('https://pastranaalex-glitch.github.io/icono-mi-dinero-real.svg',
                        'https://pastranaalex-glitch.github.io/mi-dinero-real-portada-realista.webp')
    if 'href="' + FILE + '"' not in html:
        raise RuntimeError("No se pudo activar el enlace de descarga de la ficha")
    return html

def home(html):
    html = re.sub(r'<aside class="mdr-repair-promo"\b.*?</aside>', '',
                  html, count=1, flags=re.S)
    html = re.sub(r'<style id="mi-dinero-real-aviso-css">.*?</style>\s*', '',
                  html, count=1, flags=re.S)
    html = html.replace("pack6.js?v=20261021-mi-dinero-reparacion",
                        "pack6.js?v=20261023-mi-dinero-252")
    return html

def catalogue(html):
    return html.replace("pack6.js?v=20261021-mi-dinero-reparacion",
                        "pack6.js?v=20261023-mi-dinero-252")

def soon(html):
    return re.sub(
        r'<article class="pack6-project-card pack6-project-repair" data-proxima="mi-dinero-real".*?</article>\s*',
        '', html, count=1, flags=re.S
    )

def sitemap(html):
    if "https://pastranaalex-glitch.github.io/mi-dinero-real.html" in html:
        return html
    return html.replace("</urlset>", "  <url><loc>https://pastranaalex-glitch.github.io/mi-dinero-real.html</loc></url>\n</urlset>")

def main():
    path = ROOT / FILE
    if not path.is_file():
        raise SystemExit("Pendiente: primero hay que subir a GitHub " + FILE)
    with path.open("rb") as f:
        digest = hashlib.file_digest(f, "sha256").hexdigest()
    if digest != SHA256:
        raise SystemExit("APK incorrecta o modificada: SHA-256 distinto. Publicacion cancelada.")
    print("APK verificada:", FILE, "SHA-256", digest)
    json_edit("catalogo.json", catalog)
    json_edit("actualizaciones-mi-dinero-real.json", updates)
    json_edit("proximas-apps.json", upcoming)
    edit("pack6.js", pack6)
    edit("mi-dinero-real.html", detail)
    edit("index.html", home)
    edit("catalogo.html", catalogue)
    edit("proximamente.html", soon)
    edit("sitemap.xml", sitemap)
    print("Ficha 2.5.2, descargas, portadas y avisos preparados para publicar")

if __name__ == "__main__":
    main()
