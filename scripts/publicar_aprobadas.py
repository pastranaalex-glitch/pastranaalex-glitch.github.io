#!/usr/bin/env python3
"""Publica fichas del catálogo a partir de Releases aprobadas; nunca sube binarios privados."""
import datetime as dt
import html
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request

BASE = Path(__file__).resolve().parents[1]
CONFIG = BASE / "proximas-apps.json"
CATALOG = BASE / "catalogo.json"
OWNER = "pastranaalex-glitch"
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
REPO_RE = re.compile(r"^pastranaalex-glitch/[a-z0-9]+(?:-[a-z0-9]+)*$")
NOW = lambda: dt.datetime.now(dt.timezone.utc)

def valid_release(app, release):
    if release.get("draft") or release.get("prerelease"):
        return False
    if release.get("tag_name") != app["versionAprobada"]:
        return False
    repo = app["repo"]
    suffixes = (".apk",) if app["plataforma"] == "android" else (".exe", ".msi", ".zip")
    return any(
        x.get("state") == "uploaded"
        and (not app.get("archivoAprobado") or x.get("name") == app["archivoAprobado"])
        and (not app.get("sha256Aprobado") or x.get("digest", "").lower() == "sha256:" + app["sha256Aprobado"].lower())
        and x.get("name", "").lower().endswith(suffixes)
        and not any(w in x.get("name", "").lower() for w in ("debug", "unsigned", "sin-firmar"))
        and x.get("browser_download_url", "").startswith(
            "https://github.com/" + repo + "/releases/download/"
        )
        and x.get("size", 0) > 10000
        for x in release.get("assets", [])
    )

def get_release(repo, tag):
    url = "https://api.github.com/repos/" + repo + "/releases/tags/" + urllib.parse.quote(tag, safe="")
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json", "User-Agent": "Biblioteca-publicador"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return json.load(response)

def entry(app):
    slug = app["slug"]
    return {
        "nombre": app["nombre"], "plataforma": app["plataforma"],
        "publicado": True, "version": app.get("versionVisible") or app["versionAprobada"].lstrip("vV"),
        "descripcion": app["descripcion"],
        "enlace": f"https://{OWNER}.github.io/{slug}.html",
        "slug": slug, "categorias": app["categorias"],
        "etiqueta": app["etiqueta"], "eslogan": app["eslogan"],
        "imagen": "", "icono": (app.get("icono") if app.get("icono") == "icono-en-familia.svg" and slug == "en-familia" else "favicon.svg"), "repo": app["repo"]
    }

def page(app, release):
    e = lambda value: html.escape(str(value), quote=True)
    title, slug, desc = map(e, (app["nombre"], app["slug"], app["descripcion"]))
    download = "https://github.com/" + app["repo"] + "/releases/tag/" + urllib.parse.quote(app["versionAprobada"], safe="")
    download = e(download)
    platform = "Android" if app["plataforma"] == "android" else "Windows"
    return f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index,follow"><meta name="description" content="{desc}">
<link rel="canonical" href="https://{OWNER}.github.io/{slug}.html">
<link rel="stylesheet" href="portada.css"><link rel="stylesheet" href="pack6.css">
<title>{title} gratis | Biblioteca de herramientas</title></head>
<body><header class="site-header"><div class="container header-inner"><a class="brand" href="index.html">Biblioteca de herramientas</a>
<nav class="site-nav"><a href="catalogo.html">Catálogo</a><a href="proximamente.html">Próximamente</a></nav></div></header>
<main><section class="pack6-subhero"><div class="container"><p class="section-kicker">APLICACIÓN GRATUITA</p>
<h1>{title}</h1><p>{desc}</p><p>{platform} · Versión {e(app["versionAprobada"])}</p>
<a class="button button-primary" href="{download}" rel="noopener noreferrer">Descargar versión aprobada desde GitHub →</a>
<p>Selecciona el instalador publicado en la página oficial de GitHub Releases. Comprueba el nombre del archivo antes de instalar.</p>
</div></section></main><footer class="site-footer"><div class="container footer-inner"><a href="catalogo.html">Volver al catálogo</a>
<span>Gratis · Sin ánimo de lucro</span></div></footer></body></html>
"""

def main():
    conf = json.loads(CONFIG.read_text(encoding="utf-8"))
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    apps = data.get("aplicaciones", [])
    now = NOW()
    changes = []
    for app in conf["aplicaciones"]:
        slug = app.get("slug")
        if not isinstance(slug, str) or not SLUG_RE.fullmatch(slug):
            continue
        if any(x.get("slug") == slug for x in apps):
            continue
        if app.get("publicacionAutomatica") is not True or app.get("revisionAprobada") is not True:
            continue
        repo, tag, date = app.get("repo"), app.get("versionAprobada"), app.get("fechaEstreno")
        if not isinstance(repo, str) or not (REPO_RE.fullmatch(repo) or (slug == "en-familia" and repo == OWNER + "/" + OWNER + ".github.io")) or not isinstance(tag, str) or not tag or not isinstance(date, str):
            continue
        if app.get("plataforma") not in ("android", "windows") or not all(
            isinstance(app.get(k), str) and app[k].strip() for k in ("nombre", "descripcion", "etiqueta", "eslogan")
        ) or not isinstance(app.get("categorias"), list):
            continue
        try:
            launch = dt.datetime.fromisoformat(date.replace("Z", "+00:00"))
            if launch.tzinfo is None or launch.astimezone(dt.timezone.utc) > now:
                continue
        except ValueError:
            continue
        # Limit published assets to a release of the exact approved repository and tag.
        try:
            release = get_release(repo, tag)
        except Exception as exc:
            print("Release no comprobable para", slug, str(exc))
            continue
        if not valid_release(app, release):
            print("Sin archivos válidos aprobados:", slug)
            continue
        page_path = BASE / (slug + ".html")
        if page_path.exists():
            # En Familia cuenta con una ficha detallada y verificada ya preparada.
            # No permitir que una ficha ajena o distinta se considere publicada.
            if slug != "en-familia" or 'data-publication-preview="en-familia"' not in page_path.read_text(encoding="utf-8"):
                print("No se modifica una ficha ya existente:", slug)
                continue
        else:
            page_path.write_text(page(app, release), encoding="utf-8")
        apps.append(entry(app))
        changes.append(slug)
    if changes:
        CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        # Dar de alta las fichas nuevas en el mapa de sitio, sin duplicarlas.
        sitemap = BASE / "sitemap.xml"
        if sitemap.exists():
            xml = sitemap.read_text(encoding="utf-8")
            for newly_published in changes:
                url = f"https://{OWNER}.github.io/{newly_published}.html"
                if url not in xml and "</urlset>" in xml:
                    date = now.date().isoformat()
                    xml = xml.replace("</urlset>", f"  <url><loc>{url}</loc><lastmod>{date}</lastmod></url>\n</urlset>")
            sitemap.write_text(xml, encoding="utf-8")
    print("Nuevas publicaciones:", ", ".join(changes) if changes else "ninguna")
    return changes

if __name__ == "__main__":
    main()
