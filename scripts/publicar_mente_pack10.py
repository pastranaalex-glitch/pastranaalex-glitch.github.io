#!/usr/bin/env python3
"""Publish only the user-approved Pack 10, after its public APK is verified."""
import argparse
import json
from pathlib import Path
import re
import urllib.request
from verificar_mente_apk import verify_approved_apk

REPO='pastranaalex-glitch/pastranaalex-glitch.github.io'
TAG='mente-activa-pro-v1.9.0'
FILE='Mente_Activa_PRO_1_9_0_PACK10.apk'
HASH='08d49dc63b0ebf736b3316fee52bbbecf08fe089603ec807b409fa1d8529fe06'
COVER='mente-activa-pro-pack10-portada.png'
URL=f'https://github.com/{REPO}/releases/download/{TAG}/{FILE}'

def replace_once(text,old,new):
    if text.count(old)!=1: raise ValueError('Expected exactly one page anchor: '+old[:70])
    return text.replace(old,new,1)

def update_pages(root):
    p=root/'catalogo.json';data=json.loads(p.read_text());apps=[a for a in data['aplicaciones'] if a.get('slug')=='mente-activa-pro']
    if len(apps)!=1: raise ValueError('Expected exactly one Mente catalog entry')
    a=apps[0];a.update(version='1.9.0',publicado=True,disponible=True,estado='Disponible',portada=COVER,descripcion='22 juegos de entretenimiento, con retos de razonamiento, descifrado de códigos y correspondencias por pistas. Portada realista de 5 segundos que puedes saltar o desactivar. Tres dificultades, historial y aviso de actualizaciones. Gratis y sin anuncios; juegos sin conexión.')
    a['descarga']={'version':'1.9.0','tag':TAG,'archivo':FILE,'sha256':HASH}
    p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    p=root/'mente-activa-pro.html';html=p.read_text()
    # Idempotence: only our old version and original copy are replaced.
    html=html.replace('16 juegos','22 juegos').replace('Los 16 juegos','Los 22 juegos').replace('16 formas','22 formas').replace('1.5.0','1.9.0').replace('Pack 6','Pack 10').replace('Mente_Activa_PRO_1_5_0_PACK6.apk',FILE).replace('efca9487bd4d39fb533252b8927c00585fc73095ac3c92cb1b993fafac1d3b40',HASH).replace('mente-activa-pro-portada-realista.png',COVER)
    html=html.replace('og:image:width" content="1672"','og:image:width" content="941"').replace('og:image:height" content="940"','og:image:height" content="1672"')
    html=html.replace('Portada promocional de Mente Activa PRO, con un móvil y juegos de mesa','Portada de Mente Activa PRO, con rompecabezas de madera y un cuaderno')
    html=html.replace('Portada promocional de Mente Activa PRO: un móvil con juegos de parejas, palabras, laberinto y sudoku, acompañado de fichas de madera sobre una mesa','Portada de Mente Activa PRO: rompecabezas de madera, cuaderno y fichas sobre una mesa')
    html=html.replace('width="1672" height="940" fetchpriority','width="941" height="1672" fetchpriority').replace('Ilustración promocional. La pantalla del móvil es una representación de la app.','Imagen de la nueva portada de inicio. El título y los botones se muestran dentro de la app.')
    html=html.replace('Elige entre 22 juegos de memoria, atención, palabras, cálculo y lógica. Con tres dificultades, botones amplios y todo el tiempo que quieras para pensar.','22 juegos para pensar con calma. La portada y los paseos priorizan razonamiento: operaciones combinadas, problemas de varios pasos, deducción, códigos y correspondencias. Tres dificultades y sin cronómetro.')
    html=html.replace('mente-activa-descargas.js?v=20261020-publicado','mente-activa-descargas.js?v=20261023-pack10')
    news='<h3>Novedades del Pack 10 · 1.9.0</h3><ul><li>Dos juegos nuevos: Descifra el código y Cruce de pistas, con retos generados y solución única.</li><li>22 juegos en total; portada y paseos centrados en razonamiento.</li><li>Portada realista de 5 segundos, con Entrar ahora y No volver a mostrar. Puedes reactivarla en Ajustes.</li><li>Duelo de operaciones, problemas encadenados y Orden oculto, con tres dificultades.</li><li>Memoria local para espaciar repeticiones, 347 palabras con pistas, 80 refranes y 60 retos de palabras opuestas.</li><li>Aviso de actualización dentro de la app: Actualizar / Más tarde, búsqueda manual y automática opcional.</li><li>Instala encima de la versión anterior para conservar tus datos y favoritos.</li></ul>'
    html,n=re.subn(r'<h3>Novedades del Pack 10 · 1\.9\.0</h3><ul>.*?</ul>',news,html,count=1,flags=re.S)
    if n!=1: raise ValueError('Missing version news block')
    if '<li>Descifra el código</li>' not in html:
        html=replace_once(html,'<li>Completa el refrán</li></ol>','<li>Completa el refrán</li><li>Duelo de operaciones</li><li>Palabras opuestas</li><li>Problemas encadenados</li><li>Orden oculto</li><li>Descifra el código</li><li>Cruce de pistas</li></ol>')
    html=html.replace('Se guardan en el dispositivo los ajustes, favoritos, la lectura del aviso y hasta 300 partidas','Se guardan en el dispositivo los ajustes, la preferencia de mostrar la portada, una memoria limitada de retos recientes, los favoritos, la lectura del aviso y hasta 300 partidas')
    if 'id="ma-pack10-cover"' not in html:html=replace_once(html,'</head>','<style id="ma-pack10-cover">.ma-cover img{max-height:440px;object-fit:cover;object-position:center 60%}</style>\n</head>')
    if '1.5.0' in html or '16 juegos' in html or FILE not in html or HASH not in html:raise ValueError('Incomplete Mente page update')
    p.write_text(html)
    p=root/'index.html';index=p.read_text()
    card=f'''<article class="biblio-news-card" id="noticia-mente-pack10" aria-labelledby="noticia-mente-titulo"><a class="biblio-news-picture" href="mente-activa-pro.html#novedades"><img src="{COVER}" alt="Nueva portada de Mente Activa PRO con juegos de lógica de madera" loading="lazy" decoding="async"></a><div class="biblio-news-content"><p class="biblio-news-state">YA DISPONIBLE · 1.9.0 · PACK 10</p><h3 id="noticia-mente-titulo">Mente Activa PRO: 22 juegos y más razonamiento</h3><p>Descifra códigos y relaciona personas y destinos cruzando pistas. Se suman a las operaciones combinadas, problemas de varios pasos y retos de deducción, con tres dificultades.</p><p>Nueva portada realista de 5 segundos: entra antes o desactívala cuando quieras. Conserva tus partidas al actualizar y recibe avisos de nuevas versiones dentro de la app.</p><p>Gratis, sin anuncios y con juegos sin conexión.</p><a class="biblio-news-link" href="mente-activa-pro.html">Ver novedades y descargar el Pack 10 →</a></div></article>'''
    if 'id="noticia-mente-pack10"' not in index:index=replace_once(index,'<div class="biblio-news-grid">','<div class="biblio-news-grid">\n'+card)
    index=index.replace('Dos novedades, una misma idea: seguir mejorando.','Las últimas novedades para seguir mejorando.')
    p.write_text(index)
    p=root/'privacidad.html';privacy=p.read_text();start=privacy.index('<section id="mente-activa-pro">');end=privacy.index('</section>',start)
    section=privacy[start:end]
    if 'memoria limitada de retos' not in section:section=section.replace('Se conservan los ajustes, la lectura del aviso','Se conservan los ajustes, incluida la preferencia de mostrar la portada, una memoria limitada de retos recientes para espaciar repeticiones, la lectura del aviso')
    p.write_text(privacy[:start]+section+privacy[end:])
    print('Mente Pack 10: catalog, page, news and local-data information updated')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
    if not args.preview:
        req=urllib.request.Request(f'https://api.github.com/repos/{REPO}/releases/tags/{TAG}',headers={'User-Agent':'Biblioteca-Mente-Pack10','Accept':'application/vnd.github+json'})
        with urllib.request.urlopen(req,timeout=30) as response:release=json.load(response)
        download=verify_approved_apk({'repo':REPO,'versionAprobada':TAG,'archivoAprobado':FILE,'versionCodeAprobado':10,'versionVisible':'1.9.0'},release)
        if download['sha256']!=HASH:raise ValueError('This is not the user-tested APK')
    update_pages(Path.cwd())
