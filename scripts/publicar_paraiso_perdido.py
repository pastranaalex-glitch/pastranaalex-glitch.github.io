#!/usr/bin/env python3
"""Publicación del APK de El Paraíso Perdido solo tras validar el Release real."""
import hashlib
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

REPO = "pastranaalex-glitch/pastranaalex-glitch.github.io"
TAG = "el-paraiso-perdido-v0.9.4"
APK = "El_Paraiso_Perdido_PACK9_4.apk"
SIZE = 126521633
SHA = "97cfafe0f42a548fbf220973a79df0df5ea9b36786ac76b7c51a3d648b318f6e"

def gh(*args):
    return subprocess.check_output(["gh", *args], text=True).strip()

def text(path):
    return Path(path).read_text(encoding="utf-8")

def save(path, data):
    Path(path).write_text(data, encoding="utf-8")

def replace_one(s, old, new, label):
    if old not in s:
        raise RuntimeError("No se encontró " + label)
    return s.replace(old, new, 1)

def main():
    release = json.loads(gh("api", f"repos/{REPO}/releases/tags/{TAG}"))
    if release.get("draft") or release.get("prerelease"):
        raise RuntimeError("El Release no está publicado")
    assets = [a for a in release.get("assets", []) if a.get("name") == APK and a.get("state") == "uploaded"]
    if len(assets) != 1:
        raise RuntimeError("Falta el APK correcto en el Release")
    asset = assets[0]
    if asset.get("size") != SIZE:
        raise RuntimeError("Tamaño del APK diferente: " + str(asset.get("size")))
    digest = asset.get("digest")
    if digest and digest != "sha256:" + SHA:
        raise RuntimeError("SHA-256 del asset no coincide")

    with tempfile.TemporaryDirectory() as d:
        subprocess.run(["gh","release","download",TAG,"--repo",REPO,"--pattern",APK,"--dir",d],check=True)
        file = Path(d) / APK
        h = hashlib.sha256()
        with file.open("rb") as f:
            for chunk in iter(lambda: f.read(4*1024*1024), b""):
                h.update(chunk)
        if h.hexdigest() != SHA or file.stat().st_size != SIZE:
            raise RuntimeError("La descarga no corresponde al APK firmado validado")
    apk_url = asset.get("browser_download_url", "")
    if not (apk_url.startswith(f"https://github.com/{REPO}/releases/download/{TAG}/") and apk_url.endswith("/" + APK)):
        raise RuntimeError("El URL de la descarga no pertenece al Release esperado")

    m_path="el-paraiso-perdido-version.json"
    manifest=json.loads(text(m_path))
    manifest.update(enabled=True,version_code=13,version="0.9.4",
        notes="Primera publicación de El Paraíso Perdido: 100 niveles y 5 capítulos, sin anuncios.",
        apk_url=apk_url)
    save(m_path,json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")

    catalog_path="catalogo.json"
    catalog=json.loads(text(catalog_path))
    item={
       "nombre":"El Paraíso Perdido",
       "plataforma":"android",
       "publicado":True,
       "version":"0.9.4",
       "descripcion":"Aventura tropical para Android: supera 100 expediciones, consigue cofres y construye un hogar en una isla desolada. Cinco capítulos, introducción cinematográfica y avisos de actualización.",
       "enlace":"https://pastranaalex-glitch.github.io/el-paraiso-perdido.html",
       "slug":"el-paraiso-perdido",
       "categorias":["juegos"],
       "etiqueta":"AVENTURA Y CONSTRUCCIÓN",
       "eslogan":"Convierte la isla en un paraíso.",
       "imagen":"paraiso-tablero.webp",
       "portada":"paraiso-isla.webp",
       "repo":REPO,
       "descarga":{"version":"0.9.4","tag":TAG,"archivo":APK,"sha256":SHA},
       "disponible":True
    }
    matches=[i for i,a in enumerate(catalog["aplicaciones"]) if a.get("slug")=="el-paraiso-perdido"]
    if matches:
        catalog["aplicaciones"][matches[0]]=item
    else:
        catalog["aplicaciones"].append(item)
    save(catalog_path,json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")

    pack_path="pack6.js"
    pack=text(pack_path)
    if "'el-paraiso-perdido'" not in pack:
        pack=replace_one(pack,
          "'radio-facil-pro'].includes(a.slug)",
          "'radio-facil-pro','el-paraiso-perdido'].includes(a.slug)",
          "la lista de repositorios autorizados de pack6.js")
        save(pack_path,pack)

    news_path="index.html"
    news=text(news_path)
    marker='id="noticia-el-paraiso-perdido-20261115"'
    pos=news.find(marker)
    if pos<0: raise RuntimeError("No se encontró la noticia de El Paraíso Perdido")
    begin=news.rfind("<article",0,pos)
    end=news.find("</article>",pos)+len("</article>")
    if begin<0 or end<len("</article>"): raise RuntimeError("Tarjeta de noticia mal delimitada")
    card=news[begin:end]
    card=card.replace('href="proximamente.html#el-paraiso-perdido"','href="el-paraiso-perdido.html"')
    card=card.replace("NUEVO JUEGO · PRÓXIMAMENTE","NUEVO JUEGO · DESCARGA DISPONIBLE")
    card=card.replace("Ya puedes descubrir el argumento de este próximo juego gratuito y sin anuncios. El tráiler cinematográfico se incorporará cuando esté alojado en la web.",
      "Ya disponible para Android: primera edición con 100 niveles, cinco capítulos, introducción cinematográfica y construcciones. Gratis y sin anuncios.")
    card=card.replace("Conocer la historia del juego →","Descargar gratis para Android →")
    news=news[:begin]+card+news[end:]
    news=news.replace("Conoce el próximo lanzamiento.","Descubre los juegos y las novedades de la Biblioteca.",1)
    news=re.sub(r"pack6\.js\?v=[\w.-]+","pack6.js?v=20261115-paraiso",news)
    save(news_path,news)

    coming_path="proximamente.html"
    coming=text(coming_path)
    marker='id="el-paraiso-perdido"'
    pos=coming.find(marker)
    if pos>=0:
        begin=coming.rfind("<article",0,pos)
        end=coming.find("</article>",pos)+len("</article>")
        if begin<0 or end<len("</article>"): raise RuntimeError("Tarjeta Próximamente mal delimitada")
        block=coming[begin:end]
        block=block.replace("Nuevo juego · En desarrollo","Nuevo juego · Ya disponible")
        block=block.replace("Sin descarga todavía","Descarga disponible en la Biblioteca")
        block=block.replace("Juego en desarrollo para Android. Las ilustraciones son conceptuales y no representan pantallas de una versión terminada. El tráiler cinematográfico todavía está pendiente de incorporarse a la web.",
        "Primera versión publicada para Android, con 100 niveles y cinco capítulos. Ya puedes descargar gratuitamente el juego.")
        block=block.replace("</article>",'<p><a class="button button-primary" href="el-paraiso-perdido.html">Ver ficha y descargar el juego</a></p>\n</article>',1)
        coming=coming[:begin]+block+coming[end:]
        save(coming_path,coming)

    catalog_html="catalogo.html"
    html=text(catalog_html)
    html=re.sub(r"pack6\.js\?v=[\w.-]+","pack6.js?v=20261115-paraiso",html)
    save(catalog_html,html)

    sitemap_path="sitemap.xml"
    sitemap=text(sitemap_path)
    loc="https://pastranaalex-glitch.github.io/el-paraiso-perdido.html"
    if loc not in sitemap:
        sitemap=replace_one(sitemap,"</urlset>",
             "  <url><loc>"+loc+"</loc><lastmod>2026-11-15</lastmod></url>\n</urlset>",
             "cierre del sitemap")
        save(sitemap_path,sitemap)

    print("APK oficial verificado y páginas preparadas. URL: "+apk_url)

if __name__=="__main__":
    main()
