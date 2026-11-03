#!/usr/bin/env python3
"""Instala exclusivamente el ZIP público de Aprende Fácil PRO en GitHub Pages."""
from pathlib import Path, PurePosixPath
import json, shutil, stat, zipfile

ARCHIVE=Path("AprendeFacilPRO_PACK20_4_WEB_PUBLICAR.zip")
DIR=Path("aprende-facil")
REQUIRED={"aprende-facil/index.html","aprende-facil/lector.html",
          "aprende-facil/contenido/catalogo-publico.json",
          "aprende-facil/privacidad.html","aprende-facil/instalacion.html"}

def install():
    if not ARCHIVE.is_file():
        raise RuntimeError("Falta el ZIP público en la raíz del repositorio")
    with zipfile.ZipFile(ARCHIVE) as z:
        files=[x for x in z.infolist() if not x.is_dir()]
        names=[x.filename for x in files]
        if not REQUIRED.issubset(names) or len(names)>900 or len(names)!=len(set(names)):
            raise ValueError("El ZIP no tiene la estructura pública esperada")
        total=0
        for x in z.infolist():
            p=PurePosixPath(x.filename)
            if (not p.parts or (p.parts[0]!="aprende-facil" and x.filename!="LEEME_PUBLICACION.txt") or
                p.is_absolute() or ".." in p.parts or "\\" in x.filename or
                ":" in x.filename or stat.S_ISLNK(x.external_attr>>16)):
                raise ValueError("Archivo fuera de la carpeta autorizada: "+x.filename)
            if x.file_size>8*1024*1024:
                raise ValueError("Archivo demasiado grande: "+x.filename)
            total+=x.file_size
        if total>90*1024*1024:
            raise ValueError("ZIP de tamaño descomprimido inesperado")
        courses=json.loads(z.read("aprende-facil/contenido/catalogo-publico.json"))
        count=sum(len(c.get("lessons",[])) for c in courses.get("cursos",[]))
        if courses.get("version")!="20.4" or len(courses.get("cursos",[]))!=6 or count!=261:
            raise ValueError("Catálogo no esperado: se requieren seis cursos y 261 lecciones")
        if DIR.exists(): shutil.rmtree(DIR)
        for x in files:
            p=Path(x.filename)
            p.parent.mkdir(parents=True,exist_ok=True)
            with z.open(x) as fin, p.open("wb") as out:
                shutil.copyfileobj(fin,out)
    shutil.copyfile(DIR/"assets/curso-estudio-foto.webp","aprende-facil-portada.webp")

    landing='''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Aprende Fácil PRO: 6 cursos gratuitos, 261 lecciones con imágenes, audio y ejercicios.">
<meta property="og:image" content="https://pastranaalex-glitch.github.io/aprende-facil-portada.webp">
<link rel="canonical" href="https://pastranaalex-glitch.github.io/aprende-facil.html">
<title>Aprende Fácil PRO | Biblioteca de herramientas</title>
<style>*{box-sizing:border-box}body{margin:0;font:16px/1.65 system-ui,Arial;background:#f3f6f9;color:#203a54}
header{background:#102b45;padding:19px 6%;}header a{color:white;text-decoration:none;font-weight:bold}
main{max-width:1040px;margin:25px auto;padding:0 15px 50px}.hero{background:white;border-radius:20px;overflow:hidden;box-shadow:0 12px 35px #1232}
.hero img{display:block;width:100%;height:clamp(230px,32vw,350px);object-fit:cover}.intro{padding:27px}
h1{font-size:clamp(30px,5vw,46px);margin:0}h2{font-size:1.1rem;margin:0}.lead{font-size:1.12rem;color:#53697e}
.btn{display:inline-block;background:#164e78;color:white;border-radius:11px;text-decoration:none;padding:13px 20px;font-weight:bold}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:25px 0}
.cards article{border-radius:14px;background:white;border:1px solid #e0e8ee;padding:18px}
.cards p{margin:8px 0 0;color:#526579;font-size:.92rem}@media(max-width:720px){.cards{grid-template-columns:1fr}}</style>
</head><body><header><a href="index.html">← Biblioteca de herramientas</a></header>
<main><section class="hero"><img src="aprende-facil-portada.webp" alt="Mesa realista de estudio">
<div class="intro"><p>ACADEMIA GRATUITA · 6 CURSOS · 261 LECCIONES</p><h1>Aprende Fácil PRO</h1>
<p class="lead">Astronomía, informática, móvil, inglés, matemáticas y técnicas de estudio. Explicaciones claras, imágenes, audio y ejercicios, sin anuncios ni registro.</p>
<p><a class="btn" href="aprende-facil/">Abrir los cursos gratuitos</a></p>
<p>Disponible desde navegadores compatibles de ordenador, móvil y tableta. <a href="aprende-facil/instalacion.html">Guía de uso</a>.</p></div></section>
<div class="cards"><article><h2>🌌 Explora el Universo</h2><p>64 lecciones</p></article>
<article><h2>💻 Informática desde cero</h2><p>48 lecciones</p></article>
<article><h2>📱 Aprende a utilizar tu móvil</h2><p>48 lecciones</p></article>
<article><h2>🇬🇧 Inglés desde cero A1</h2><p>40 lecciones y práctica diaria</p></article>
<article><h2>🧠 Cómo estudiar y memorizar</h2><p>12 lecciones</p></article>
<article><h2>➗ Matemáticas paso a paso</h2><p>49 lecciones</p></article></div>
<p>El progreso se guarda en tu navegador, no se sincroniza entre dispositivos.
<a href="aprende-facil/privacidad.html">Privacidad</a>. Los certificados no tienen validez académica oficial.</p>
</main></body></html>'''
    Path("aprende-facil.html").write_text(landing,encoding="utf-8")
    catfile=Path("catalogo.json")
    catalogue=json.loads(catfile.read_text(encoding="utf-8"))
    apps=catalogue["aplicaciones"]
    apps[:]=[x for x in apps if x.get("slug")!="aprende-facil"]
    apps.append({
      "nombre":"Aprende Fácil PRO","slug":"aprende-facil",
      "plataforma":"windows","publicado":True,"disponible":True,
      "version":"20.4",
      "descripcion":"Academia web gratuita para ordenador, móvil y tableta: 6 cursos y 261 lecciones de astronomía, informática, uso del móvil, inglés, matemáticas y técnicas de estudio. Imágenes, audios y ejercicios, sin publicidad.",
      "enlace":"https://pastranaalex-glitch.github.io/aprende-facil.html",
      "categorias":["educacion","utilidades"],
      "etiqueta":"ACADEMIA GRATUITA",
      "eslogan":"Aprende a tu ritmo, gratis y sin anuncios.",
      "imagen":"aprende-facil-portada.webp","portada":"aprende-facil-portada.webp",
      "icono":"aprende-facil/assets/icono-192.png",
      "repo":"pastranaalex-glitch/pastranaalex-glitch.github.io",
      "valoracionesDisponibles":False
    })
    catfile.write_text(json.dumps(catalogue,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    ARCHIVE.unlink()
    print("Validado y preparado: 6 cursos, 261 lecciones y ficha en el catálogo.")

if __name__=="__main__": install()
