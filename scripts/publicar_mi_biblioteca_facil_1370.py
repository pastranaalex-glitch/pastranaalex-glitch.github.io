#!/usr/bin/env python3
"""Activa exclusivamente Mi Biblioteca Fácil 1.37.0 tras validar su APK firmada."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

APK_NAME = "MiBibliotecaFacil_1.37.0_PUBLICA.apk"
APK = Path("biblioteca-app/apk") / APK_NAME
EXPECTED_SHA = "0fdb6b7c4a8b361af0f1b26a4519d7d979649d8a5a41680a221c4cecf6d2e889"
EXPECTED_SIZE = 28177056
REPO = "pastranaalex-glitch/pastranaalex-glitch.github.io"
TAG = "mi-biblioteca-facil-v1.37.0"
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
    "versionCode": 52,
    "versionName": "1.37.0",
    "apkUrl": SITE_URL + "biblioteca-app/apk/" + APK_NAME,
    "sha256": sha,
    "sizeBytes": EXPECTED_SIZE,
    "notes": "Primera versión pública. Lectura EPUB/PDF, cinco libros iniciales y sincronización del catálogo."
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
    "version": "1.37.0",
    "descripcion": "Biblioteca digital gratuita con estanterías de madera, cinco libros iniciales, lector PDF y EPUB, portadas y sincronización de nuevos títulos.",
    "enlace": SITE_URL + SLUG + ".html",
    "categorias": ["lectura", "utilidades"],
    "etiqueta": "BIBLIOTECA DIGITAL",
    "eslogan": "Tu rincón de lectura.",
    "imagen": "mi-biblioteca-facil-estanteria.svg",
    "icono": "mi-biblioteca-facil-portada.svg",
    "portada": "mi-biblioteca-facil-portada.svg",
    "repo": REPO,
    "descarga": {"version": "1.37.0", "tag": TAG, "archivo": APK_NAME, "sha256": sha}
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
            "versionAprobada": "1.37.0",
            "versionVisible": "1.37.0",
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

path = Path("proximamente.html")
html = path.read_text(encoding="utf-8")
start = html.find('<article class="pack6-project-card pack6-project-library"')
if start>=0:
    end = html.find("</article>",start)
    if end<0:
        raise SystemExit("No se encuentra el final de la ficha en Próximamente.")
    end+=len("</article>")
    block=html[start:end]
    block=block.replace('data-proxima="mi-biblioteca-facil"','data-proxima="mi-biblioteca-facil" data-publicado="true"',1)
    block=block.replace('En desarrollo · Próximamente','Disponible · Descarga gratuita',1)
    block=block.replace('Estamos preparando un salón de lectura con chimenea y estanterías de madera, donde podrás explorar las novelas de la colección y añadir tus propios libros.',
                        'Incluye un salón de lectura con chimenea y estanterías de madera, donde puedes explorar las novelas de la colección y añadir tus propios libros.',1)
    block=block.replace('Trabajamos en dos formas de explorar la colección: libros colocados de canto y portadas completas. También preparamos búsqueda, lectura cómoda, guardado del progreso y copias de seguridad.',
                        'Puedes explorar los libros de canto o por sus portadas, buscar títulos, leer y conservar tu progreso con copias de seguridad.',1)
    block=block.replace('El diseño incluirá copias de seguridad y restauración para proteger tu colección al actualizar o cambiar de dispositivo.',
                        'La aplicación incluye copias de seguridad y restauración para proteger tu colección al actualizar o cambiar de dispositivo.',1)
    block=block.replace('El diseño real se está perfeccionando y se publicará cuando pase las pruebas.',
                        'La versión pública 1.37.0 ya está disponible para descargar.',1)
    block=block.replace('Aplicación Android en desarrollo; sin descarga disponible todavía. Fecha de publicación por confirmar.',
                        'Aplicación disponible para Android. Imagen promocional ilustrativa, no captura de pantalla.',1)
    block=block.replace('</article>', '<p><a href="mi-biblioteca-facil.html"><strong>Ver ficha y descargar Mi Biblioteca Fácil</strong></a></p>\n</article>',1)
    path.write_text(html[:start]+block+html[end:],encoding="utf-8")

path = Path("sitemap.xml")
xml = path.read_text(encoding="utf-8")
url = SITE_URL + SLUG + ".html"
if url not in xml:
    today = datetime.now(timezone.utc).date().isoformat()
    xml=xml.replace("</urlset>",f'  <url><loc>{url}</loc><lastmod>{today}</lastmod></url>\n</urlset>')
    path.write_text(xml,encoding="utf-8")

print("Ficha, catálogo, canal de actualizaciones y sitemap preparados.")
