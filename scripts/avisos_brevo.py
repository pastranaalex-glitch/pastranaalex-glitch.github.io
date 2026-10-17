#!/usr/bin/env python3
"""Crea BORRADORES de novedades para Brevo al detectar Releases de GitHub.

NO contiene llamadas para enviar campañas. Requiere únicamente Python 3 estándar.
Se ejecuta desde el repositorio de GitHub Pages de la Biblioteca.
"""
from __future__ import annotations

import argparse
from html import escape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlparse, urlencode
from urllib.request import Request, urlopen

BASE = Path(__file__).resolve().parent.parent
STATE_FILE = BASE / '.github' / 'avisos_estado.json'
TEMPLATE_FILE = BASE / 'scripts' / 'plantilla_novedad.html'
OWNER = 'pastranaalex-glitch'
SITE = 'https://pastranaalex-glitch.github.io/'
BREVO_API = 'https://api.brevo.com/v3/emailCampaigns'
TIMEOUT = 25
MAX_DRAFTS_PER_RUN = 5


class CatalogueParser(HTMLParser):
    """Lee las fichas REALES del catálogo visible de la portada."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.article_level = 0
        self.item = None
        self.headline = False
        self.apps = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if self.item is not None:
            if tag == 'article':
                self.article_level += 1
            if tag == 'h3':
                self.headline = True
            if tag == 'a' and attributes.get('href', '').endswith('.html'):
                link = attributes['href']
                if re.fullmatch(r'[a-z0-9-]+\.html', link):
                    self.item['ficha'] = SITE + link
            return
        if tag == 'article' and 'data-app-card' in attributes:
            repo = attributes.get('data-repo', '').strip()
            if not re.fullmatch(r'pastranaalex-glitch/[A-Za-z0-9_.-]+', repo):
                raise ValueError('Repositorio no reconocido en una ficha: ' + repo[:80])
            self.item = {'repo': repo, 'nombre': '', 'ficha': ''}
            self.article_level = 1

    def handle_data(self, data):
        if self.item is not None and self.headline:
            self.item['nombre'] += data

    def handle_endtag(self, tag):
        if self.item is None:
            return
        if tag == 'h3':
            self.headline = False
        if tag != 'article':
            return
        self.article_level -= 1
        if self.article_level == 0:
            if not self.item['nombre'].strip() or not self.item['ficha']:
                raise ValueError('Falta nombre o ficha para ' + self.item['repo'])
            self.item['nombre'] = self.item['nombre'].strip()
            self.apps.append(self.item)
            self.item = None


def get_catalogue():
    """Lee las aplicaciones publicadas desde catalogo.json.

    Las releases de aplicaciones con repositorio propio se pueden identificar
    inequívocamente. Las publicadas en el repositorio compartido de esta web
    requieren una detección por etiqueta/archivo y se omiten por seguridad.
    """
    catalogue_file = BASE / 'catalogo.json'
    catalogue = json.loads(catalogue_file.read_text(encoding='utf-8'))
    if not isinstance(catalogue, dict) or not isinstance(catalogue.get('aplicaciones'), list):
        raise ValueError('catalogo.json no contiene una lista de aplicaciones válida')

    apps = []
    seen_repos = set()
    shared_repo = OWNER + '/' + OWNER + '.github.io'
    for record in catalogue['aplicaciones']:
        if not isinstance(record, dict):
            raise ValueError('Entrada inválida en catalogo.json')
        if record.get('publicado') is not True:
            continue

        repo = record.get('repo')
        if repo == shared_repo:
            # No se puede identificar una app concreta solo por latest release:
            # hacerlo ocasionaría avisos duplicados o sobre la app equivocada.
            continue
        if not isinstance(repo, str) or not re.fullmatch(
                r'pastranaalex-glitch/[A-Za-z0-9_.-]+', repo):
            raise ValueError('Repositorio no reconocido en catalogo.json')
        nombre, slug = record.get('nombre'), record.get('slug')
        if not isinstance(nombre, str) or not nombre.strip():
            raise ValueError('Falta nombre de aplicación en catalogo.json')
        if not isinstance(slug, str) or not re.fullmatch(r'[a-z0-9-]+', slug):
            raise ValueError('Slug de ficha inválido en catalogo.json')
        ficha = SITE + slug + '.html'
        if record.get('enlace') != ficha:
            raise ValueError('Enlace de ficha inesperado para ' + nombre)
        if repo in seen_repos:
            raise ValueError('Hay repositorios duplicados en catalogo.json: ' + repo)
        seen_repos.add(repo)
        apps.append({'repo': repo, 'nombre': nombre.strip(), 'ficha': ficha})

    if not apps:
        raise ValueError('No hay aplicaciones con repositorio propio publicadas en catalogo.json')
    return apps


def request_json(url, *, method='GET', payload=None, headers=None):
    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    h = {'Accept': 'application/json', 'User-Agent': 'BibliotecaAvisos/5.5 (GitHub Actions)'}
    if headers:
        h.update(headers)
    if body is not None:
        h['Content-Type'] = 'application/json'
    req = Request(url, data=body, headers=h, method=method)
    try:
        with urlopen(req, timeout=TIMEOUT) as res:
            return json.load(res)
    except HTTPError as exc:
        # La API key NUNCA se imprime en logs; tampoco se imprime el cuerpo remoto.
        if exc.code == 404 and url.startswith('https://api.github.com/'):
            return None
        raise RuntimeError(f'Error HTTP {exc.code} en servicio {urlparse(url).netloc}') from None
    except URLError as exc:
        raise RuntimeError('No se pudo conectar con ' + urlparse(url).netloc) from exc


def get_release(repo):
    headers = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    gh_token = os.getenv('GH_TOKEN', '').strip()
    if gh_token:
        headers['Authorization'] = 'Bearer ' + gh_token
    release = request_json('https://api.github.com/repos/' + repo + '/releases/latest', headers=headers)
    if release is None:
        print(f'AVISO: {repo}: no hay Release pública accesible; se omite sin enviar nada.')
        return None
    if release.get('draft') or release.get('prerelease'):
        return None
    assets = release.get('assets') or []
    # No anunciar versiones vacías ni releases cuyo artefacto no pueda descargarse.
    files = [a for a in assets if a.get('state') == 'uploaded' and a.get('browser_download_url')]
    if not files:
        print(f'AVISO: {repo}: Release sin instalador/archivo publicado; no se anuncia.')
        return None
    link = release.get('html_url', '')
    if not link.startswith('https://github.com/' + repo + '/releases/'):
        raise ValueError('URL de Release no válida para ' + repo)
    if not isinstance(release.get('id'), int):
        raise ValueError('Release sin ID correcto: ' + repo)
    return release


def compact_notes(value, limit=360):
    text = value or ''
    text = re.sub(r'!?(?:\[([^\]]+)\])\([^)]*\)', r'\1', text)
    text = re.sub(r'(?m)^\s*#{1,6}\s*', '', text)
    text = re.sub(r'<[^>]*>', ' ', text)
    text = re.sub(r'[`*_>#|]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) > limit:
        text = text[:limit].rsplit(' ', 1)[0] + '…'
    return text or 'Ya puedes consultar los detalles y descargar la nueva versión desde la Biblioteca.'


def render_email(app, release, kind):
    template = TEMPLATE_FILE.read_text(encoding='utf-8')
    name = app['nombre']
    tag = str(release.get('tag_name') or 'Nueva versión')[:60]
    notes = compact_notes(release.get('body'))
    tags = {
        'TIPO': 'NUEVA APLICACIÓN' if kind == 'nueva' else 'ACTUALIZACIÓN DISPONIBLE',
        'TITULO': 'Descubre ' + name if kind == 'nueva' else name + ' se ha actualizado',
        'APP': name,
        'VERSION': tag,
        'RESUMEN': notes,
        'FICHA_URL': app['ficha'],
        'RELEASE_URL': release['html_url'],
    }
    for key, val in tags.items():
        # Evita HTML e interpolaciones de plantilla procedentes de notas externas.
        safe = escape(val, quote=True).replace('{', '&#123;').replace('}', '&#125;')
        template = template.replace('%%' + key + '%%', safe)
    if '%%' in template or '{{ unsubscribe }}' not in template:
        raise ValueError('Error de plantilla: falta reemplazar un campo o el enlace de baja')
    return template


def campaign_marker(repo, release_id):
    return f'B55 AUTO [{repo}] release-{release_id}'


def brevo_headers():
    api_key = os.getenv('BREVO_API_KEY', '').strip()
    if not api_key:
        raise RuntimeError('Configura BREVO_API_KEY en los secretos de GitHub Actions antes de crear borradores')
    return {'api-key': api_key}


def existing_campaign(marker):
    # Previene duplicados si el borrador ya se creó y falló el guardado del estado.
    # Busca tanto borradores como campañas enviadas (hasta 300 recientes).
    headers = brevo_headers()
    for offset in range(0, 300, 100):
        q = urlencode({'type': 'classic', 'limit': 100,
                       'offset': offset, 'excludeHtmlContent': 'true'})
        response = request_json(BREVO_API + '?' + q, headers=headers)
        campaigns = response.get('campaigns') or []
        if any(c.get('name') == marker for c in campaigns):
            return True
        if len(campaigns) < 100:
            return False
    raise RuntimeError('Más de 300 campañas en Brevo; comprueba el historial antes de continuar')


def create_draft(app, release, kind):
    sender_email = os.getenv('BREVO_SENDER_EMAIL', '').strip()
    if not sender_email or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', sender_email):
        raise RuntimeError('Configura BREVO_SENDER_EMAIL con un remitente verificado de Brevo')
    list_id = int(os.getenv('BREVO_LIST_ID', '3'))
    if list_id <= 0:
        raise ValueError('BREVO_LIST_ID debe ser un número positivo')
    marker = campaign_marker(app['repo'], release['id'])
    if existing_campaign(marker):
        print('El borrador ya existía en Brevo:', marker)
        return 'existente'
    tag = str(release.get('tag_name', ''))[:60]
    subject = (f'🆕 Nueva aplicación: {app["nombre"]}' if kind == 'nueva'
               else f'🔔 {app["nombre"]}: actualización {tag}')
    payload = {
        'name': marker,
        'subject': subject[:128],
        'previewText': ('Nueva aplicación gratuita en la Biblioteca.' if kind == 'nueva'
                        else 'Una aplicación de nuestra Biblioteca tiene una nueva versión.'),
        'sender': {'name': 'Biblioteca de herramientas', 'email': sender_email},
        'recipients': {'listIds': [list_id]},
        'htmlContent': render_email(app, release, kind),
        'tag': 'avisos-auto-biblioteca',
    }
    response = request_json(BREVO_API, method='POST', payload=payload, headers=brevo_headers())
    print('Borrador creado para revisar en Brevo:', marker, '| id', response.get('id', '?'))
    return 'creado'


def read_state():
    if not STATE_FILE.exists():
        return {'version': 1, 'initialized': False, 'repos': {}}
    state = json.loads(STATE_FILE.read_text(encoding='utf-8'))
    if state.get('version') != 1 or not isinstance(state.get('repos'), dict):
        raise ValueError('Archivo de estado de avisos no válido')
    return state


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def new_state_record(app, release):
    return {'nombre': app['nombre'], 'ultima_release_id': release['id'] if release else None,
            'ultima_etiqueta': release.get('tag_name') if release else None}


def run(dry_run=False):
    apps = get_catalogue()
    state = read_state()
    print(f'Fichas detectadas: {len(apps)}. Estado inicializado: {bool(state.get("initialized"))}.')
    # Consulta primero las versiones públicas sin alterar los datos.
    releases = {app['repo']: get_release(app['repo']) for app in apps}
    if not state.get('initialized'):
        print('PRIMERA EJECUCIÓN: solo se guardan versiones de referencia; no se crean borradores.')
        if not dry_run:
            state['repos'] = {app['repo']: new_state_record(app, releases[app['repo']]) for app in apps}
            state['initialized'] = True
            save_state(state)
        return

    created = 0
    for app in apps:
        repo = app['repo']
        release = releases[repo]
        if release is None:
            continue
        previous = state['repos'].get(repo)
        if previous and previous.get('ultima_release_id') == release['id']:
            continue
        kind = 'nueva' if previous is None else 'actualizacion'
        print('Detectado:', kind, app['nombre'], release.get('tag_name', ''))
        if dry_run:
            continue
        if created >= MAX_DRAFTS_PER_RUN:
            print('Límite de borradores alcanzado; se atenderá en la siguiente ejecución.')
            break
        create_draft(app, release, kind)
        # SOLO registrar la versión si Brevo confirmó creación/existencia del borrador.
        state['repos'][repo] = new_state_record(app, release)
        save_state(state)
        created += 1
    if not created:
        print('No hay novedades que requieran borradores de correo.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='Consultar y mostrar cambios sin modificar nada')
    args = parser.parse_args()
    try:
        run(dry_run=args.dry_run)
    except (ValueError, RuntimeError, OSError, json.JSONDecodeError) as error:
        print('ERROR:', error, file=sys.stderr)
        sys.exit(1)
