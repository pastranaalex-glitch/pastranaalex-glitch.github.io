#!/usr/bin/env python3
"""Activa exclusivamente Mi Biblioteca Fácil 1.37.1 tras validar su APK firmada."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

APK_NAME = "MiBibliotecaFacil_1.37.1_PUBLICA.apk"
APK = Path("biblioteca-app/apk") / APK_NAME
EXPECTED_SHA = "74af334ce3790647bcdf935cbae700031f229e4f0d84d6dc6c2dc6f5d9e5101e"
EXPECTED_SIZE = 28177024
REPO = "pastranaalex-glitch/pastranaalex-glitch.github.io"
TAG = "mi-biblioteca-facil-v1.37.1"
SITE_URL = "https://pastranaalex-glitch.github.io/"
SLUG = "mi-biblioteca-facil"

if not APK.is_file() or APK.stat().st_size != EXPECTED_SIZE:
    raise SystemExit("APK ausente o tamaño incorrecto. Se cancela la publicación.")
sha = hashlib.file_digest(APK.open("rb"), "sha256").hexdigest()
if sha != EXPECTED_SHA:
    raise SystemExit("SHA-256 incorrecto. Se cancela la publicación.")
print("APK verificada:", APK_NAME, sha)

def save_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

release = {
    "schema": 1,
    "versionCode": 53,
    "versionName": "1.37.1",
    "apkUrl": SITE_URL + "biblioteca-app/apk/" + APK_NAME,
    "sha256": sha,
    "sizeBytes": EXPECTED_SIZE,
    "notes": "Mejora de privacidad: dos botones de consentimiento, para aceptar o rechazar estadísticas de lectura. Mantiene los libros y su progreso."
}
save_json("biblioteca-app/actualizacion-release.json", release)

path = Path("catalogo.json")
catalog = json.loads(path.read_text(encoding="utf-8-sig"))
items = catalog["aplicaciones"]
entry = {
    "nombre": "Mi Biblioteca Fácil",
    "slug": SLUG,
    "plataforma": "android",
    "publicado": True,
    "disponible": True,
    "version": "1.37.1",
    "descripcion": "Biblioteca digital gratuita con estanterías de madera, cinco libros iniciales, lector PDF y EPUB, portadas y sincronización de nuevos títulos.",
    "enlace": SITE_URL + SLUG + ".html",
    "categorias": ["lectura", "utilidades"],
    "etiqueta": "BIBLIOTECA DIGITAL",
    "eslogan": "Tu rincón de lectura.",
    "imagen": "mi-biblioteca-facil-estanteria.svg",
    "icono": "mi-biblioteca-facil-portada.svg",
    "portada": "mi-biblioteca-facil-portada.svg",
    "repo": REPO,
    "descarga": {"version": "1.37.1", "tag": TAG, "archivo": APK_NAME, "sha256": sha}
}
matches = [i for i,a in enumerate(items) if a.get("slug")==SLUG]
if len(matches)>1:
    raise SystemExit("Hay duplicados de la aplicación en el catálogo.")
if matches:
    items[matches[0]] = entry
else:
    items.append(entry)
save_json(path,catalog)

path = Path("proximas-apps.json")
nextapps = json.loads(path.read_text(encoding="utf-8-sig"))
for app in nextapps.get("aplicaciones", []):
    if app.get("slug")==SLUG:
        app.update({
            "versionAprobada": "1.37.1",
            "versionVisible": "1.37.1",
            "revisionAprobada": True,
            "apkSubido": True,
            "releasePublicada": True,
            "archivoAprobado": APK_NAME,
            "sha256Aprobado": sha,
            "descargasBloqueadas": False,
            "motivoBloqueo": "",
            "estado": "PUBLICADA"
        })
save_json(path,nextapps)

path = Path("pack6.js")
js = path.read_text(encoding="utf-8")
old = "'sopa-de-letras-pro'].includes(a.slug)"
new = "'sopa-de-letras-pro','mi-biblioteca-facil'].includes(a.slug)"
if old in js:
    path.write_text(js.replace(old,new,1),encoding="utf-8")
elif new not in js:
    raise SystemExit("No se ha podido habilitar la ficha en pack6.js.")

# La ficha de Próximamente ya fue publicada en 1.37.0. Evitar duplicados.
path = Path("proximamente.html")
html = path.read_text(encoding="utf-8")
updated = html.replace("La versión pública 1.37.0 ya está disponible para descargar.",
                       "La versión pública 1.37.1 ya está disponible para descargar.", 1)
if updated != html:
    path.write_text(updated, encoding="utf-8")

# Actualizar los enlaces visibles de la ficha solamente después de verificar la APK.
path = Path("mi-biblioteca-facil.html")
html = path.read_text(encoding="utf-8")
updated = html.replace("MiBibliotecaFacil_1.37.0_PUBLICA.apk", APK_NAME)
updated = updated.replace("1.37.0", "1.37.1")
if updated == html or "MiBibliotecaFacil_1.37.1_PUBLICA.apk" not in updated:
    raise SystemExit("No fue posible actualizar el enlace de la ficha.")
path.write_text(updated, encoding="utf-8")

path = Path("sitemap.xml")
xml = path.read_text(encoding="utf-8")
url = SITE_URL + SLUG + ".html"
if url not in xml:
    today = datetime.now(timezone.utc).date().isoformat()
    xml=xml.replace("</urlset>",f'  <url><loc>{url}</loc><lastmod>{today}</lastmod></url>\n</urlset>')
    path.write_text(xml,encoding="utf-8")

print("Ficha, catálogo, canal de actualizaciones y sitemap preparados.")
