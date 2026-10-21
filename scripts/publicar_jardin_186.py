#!/usr/bin/env python3
"""Activa el Pack 36 en la web cuando su APK pública coincide con la aprobada.

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
VERSION = "1.8.6"
TAG = "jardin-de-joyas-v1.8.6"
FILENAME = "Jardin_de_Joyas_1_8_6_PACK36_FIRMA_EXISTENTE.apk"
SHA256 = "67e42d3021ea05c192f5473374eb45338827d904a299be66bf6e8629cda21469"
SIZE = 72213566
DOWNLOAD = f"https://github.com/{REPO}/releases/download/{TAG}/{FILENAME}"
PREVIOUS_TAG = "jardin-de-joyas-v1.7.5"
DESCRIPTION = ("Juego gratuito sin anuncios con 200 niveles, tablero ampliado, modo Relax, "
               "ocho melodías relajantes y progreso visible para Flores de Oro y semillas especiales. "
               "Jardín Vivo, combos mejorados y estadísticas opcionales.")


def get_release():
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "Biblioteca-Jardin-Pack36"}
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
    request = Request(asset["browser_download_url"], headers={"User-Agent": "Biblioteca-Jardin-Pack36"})
    with urlopen(request, timeout=45) as response:
        while chunk := response.read(1048576):
            size += len(chunk)
            if size > SIZE:
                raise ValueError("La APK pública supera el tamaño aprobado")
            digest.update(chunk)
    if size != SIZE or digest.hexdigest() != SHA256:
        raise ValueError("La APK pública no coincide con el Pack 36 aprobado")


def replace_one(text, pattern, replacement):
    result, count = re.subn(pattern, lambda _: replacement, text, flags=re.S)
    if count != 1:
        raise ValueError("La estructura de la web ha cambiado; revisar antes de publicar")
    return result


def update_detail(text):
    text = text.replace("1.7.5", VERSION).replace(
        "Jardin_de_Joyas_1_7_5_PACK25_FIRMA_EXISTENTE.apk", FILENAME).replace(
        "946be6f35d5cd216ea55f97159519055503627e24c7822af61b86e441514126f", SHA256)
    text = replace_one(text, r'<meta name="description" content="[^"]*">',
                       f'<meta name="description" content="Descarga Jardín de Joyas {VERSION} para Android: 200 niveles, ocho melodías relajantes y objetivos de Flores de Oro y semillas a la vista. Gratis y sin anuncios.">')
    text = replace_one(text, r'<p class="detail-subtitle">.*?</p>',
                       '<p class="detail-subtitle">Un tablero más grande, joyas con más detalle y combos espectaculares. Disfruta de 200 niveles o del modo Relax con ocho melodías relajantes, mientras consultas cuánto te falta para conseguir Flores de Oro y semillas especiales.</p>')
    text = replace_one(text, r'<p class="detail-note" id="jj-estado".*?</p>',
                       f'<p class="detail-note" id="jj-estado" role="status" aria-live="polite"><strong>Versión {VERSION} disponible.</strong> APK firmada con el mismo certificado que la versión 1.7.5 publicada y verificada por SHA-256.</p>')
    text = text.replace('>Próxima actualización</a>', f'>Novedades de {VERSION}</a>')
    section = f'''<section class="jj-update-section" id="proxima-actualizacion" aria-labelledby="jj-update-title">
<div class="container"><div class="jj-update-panel">
<p class="jj-update-kicker">YA DISPONIBLE · {VERSION}</p>
<h2 id="jj-update-title">Más música, más brillo y objetivos a la vista</h2>
<p class="jj-update-lead">El Pack 36 reúne las mejoras visuales del juego, amplía la música y muestra el progreso hacia las recompensas del jardín.</p>
<ul class="jj-update-list">
<li><strong>Flores de Oro y semillas especiales.</strong> Consulta a la derecha qué necesitas y cuánto llevas conseguido. Toca cada indicador para ver la explicación.</li>
<li><strong>Ocho melodías relajantes.</strong> Música instrumental con selector, reproducción en orden, aleatoria o repetición. Créditos y licencias CC0 incluidos.</li>
<li><strong>Joyas con más detalle.</strong> Piezas más definidas, con facetas y reflejos renovados.</li>
<li><strong>Combos más potentes.</strong> Combinaciones de especiales y reacciones en cadena más vistosas.</li>
<li><strong>Más espacio para jugar.</strong> Tablero ampliado y controles organizados a los lados.</li>
<li><strong>Un Jardín Vivo renovado.</strong> Mejoras visuales en el jardín y una estatua con más detalle.</li>
</ul>
<p class="jj-update-note">Incluye 200 niveles y modo Relax. Si tienes la versión 1.7.5 de esta web, instala la actualización encima para conservar tu progreso, sin desinstalar el juego.</p>
</div></div></section>'''
    text = replace_one(text, r'<section class="jj-update-section" id="proxima-actualizacion".*?</section>', section)
    information = f'''<div class="jj-panel" id="informacion-descarga"><p id="jj-descargas-acumuladas" class="detail-note" role="status" aria-live="polite">Consultando descargas acumuladas de Jardín de Joyas...</p><h3>Versión {VERSION} disponible</h3><p>Descarga la APK oficial gratuita desde <a href="{DOWNLOAD}" rel="noopener noreferrer">GitHub Releases</a>. Incluye los nuevos indicadores de Flores de Oro y semillas especiales, ocho melodías relajantes, joyas más definidas, combos mejorados y tablero ampliado. Mantiene los 200 niveles, el modo Relax, el Jardín Vivo, los avisos de actualización y las estadísticas opcionales.</p><p><strong>SHA-256:</strong> <code class="jj-hash">{SHA256}</code></p><p><a href="https://github.com/{REPO}/releases/tag/{PREVIOUS_TAG}" rel="noopener noreferrer">Versión anterior 1.7.5</a> (solo para quienes necesiten consultar la publicación anterior).</p><p>La versión 1.8.6 conserva el paquete y el certificado de firma de la 1.7.5 publicada. Si ya tienes una versión antigua con una firma Android diferente, guarda primero una copia de tu partida fuera del teléfono antes de decidir reinstalar. Consulta también la <a href="privacidad.html#jardin-joyas-estadisticas">información sobre las estadísticas opcionales</a>.</p></div>'''
    return replace_one(text, r'<div class="jj-panel" id="informacion-descarga">.*?</div>', information)


def update_home(text):
    article = '''<article class="biblio-news-card biblio-news-card--joyas" aria-labelledby="noticia-joyas-titulo">
            <a class="biblio-news-picture" href="jardin-de-joyas.html#proxima-actualizacion" aria-label="Ver las novedades y descargar Jardín de Joyas 1.8.6"><img src="jardin-joyas-inicio.jpg" alt="Captura de una versión anterior de Jardín de Joyas" loading="lazy" decoding="async"></a>
            <div class="biblio-news-content">
              <p class="biblio-news-state">✦ YA DISPONIBLE · 1.8.6</p>
              <h3 id="noticia-joyas-titulo">Jardín de Joyas estrena música y objetivos</h3>
              <p>Flores de Oro y semillas con el progreso a la vista, ocho melodías relajantes, joyas más definidas y un tablero más grande.</p>
              <a class="biblio-news-link" href="jardin-de-joyas.html#proxima-actualizacion">Ver novedades y descargar →</a>
            </div>
          </article>'''
    return replace_one(text, r'<article class="biblio-news-card biblio-news-card--joyas".*?</article>', article)


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
        print("Jardín Pack 36: la configuración no autoriza esta APK")
        return []
    if current.get("version") not in ("1.7.5", VERSION) or current.get("publicado") is not True:
        print("Jardín Pack 36: se conserva la versión del catálogo")
        return []
    current.update(version=VERSION, descripcion=DESCRIPTION, disponible=True, estado="Disponible",
                   descarga={"version": VERSION, "tag": TAG, "archivo": FILENAME, "sha256": SHA256})
    current.pop("anuncioActualizacion", None)
    approved["apkSubido"] = True
    updated = {
        "catalogo.json": json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n",
        "proximas-apps.json": json.dumps(config, ensure_ascii=False, indent=2) + "\n",
        "jardin-de-joyas.html": update_detail((base / "jardin-de-joyas.html").read_text(encoding="utf-8")),
        "index.html": update_home((base / "index.html").read_text(encoding="utf-8")),
    }
    changes = [name for name, content in updated.items() if (base / name).read_text(encoding="utf-8") != content]
    if not changes:
        print("Jardín Pack 36: la web ya está actualizada")
        return []
    asset = approved_asset(get_release())
    if asset is None:
        print("Jardín Pack 36: esperando la Release pública con la APK aprobada")
        return []
    verify_asset(asset)
    for name in changes:
        (base / name).write_text(updated[name], encoding="utf-8")
    print("Jardín Pack 36 verificado. Actualizados:", ", ".join(changes))
    return changes


if __name__ == "__main__":
    publish(Path(__file__).resolve().parents[1])
