import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
MOD = ROOT / 'scripts' / 'avisos_brevo.py'
spec = importlib.util.spec_from_file_location('avisos_brevo', MOD)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class TestAvisos(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / '.github').mkdir()
        (self.root / 'scripts').mkdir()
        shutil.copy(ROOT / 'scripts' / 'plantilla_novedad.html', self.root / 'scripts' / 'plantilla_novedad.html')
        # Las pruebas emplean el formato actual y real: catalogo.json.
        self.catalogue = {'formato': 2, 'aplicaciones': [
            {'nombre': 'Lector Fácil', 'slug': 'lector-facil', 'publicado': True,
             'repo': 'pastranaalex-glitch/lector-facil',
             'enlace': 'https://pastranaalex-glitch.github.io/lector-facil.html'},
            {'nombre': 'Cocina Clara', 'slug': 'cocina-clara', 'publicado': True,
             'repo': 'pastranaalex-glitch/cocina-clara',
             'enlace': 'https://pastranaalex-glitch.github.io/cocina-clara.html'},
        ]}
        self.save_catalogue()
        self.patch_base = patch.object(mod, 'BASE', self.root)
        self.patch_state = patch.object(mod, 'STATE_FILE', self.root / '.github' / 'avisos_estado.json')
        self.patch_template = patch.object(mod, 'TEMPLATE_FILE', self.root / 'scripts' / 'plantilla_novedad.html')
        for patcher in (self.patch_base, self.patch_state, self.patch_template): patcher.start()
        self.addCleanup(self.patch_base.stop)
        self.addCleanup(self.patch_state.stop)
        self.addCleanup(self.patch_template.stop)
        self.addCleanup(self.temp.cleanup)
        self.releases = {'pastranaalex-glitch/lector-facil': self.release(101,'v1.0'),
                         'pastranaalex-glitch/cocina-clara': self.release(200,'v1.0')}

    def save_catalogue(self):
        import json
        (self.root / 'catalogo.json').write_text(
            json.dumps(self.catalogue, ensure_ascii=False), encoding='utf-8')

    @staticmethod
    def release(id, tag):
        return {'id': id, 'tag_name': tag, 'body': 'Cambios: mejoras de funcionamiento.',
                'html_url': 'https://github.com/pastranaalex-glitch/lector-facil/releases/tag/' + tag,
                'assets': [{'state': 'uploaded', 'browser_download_url': 'https://example.org/a.apk'}]}

    def test_catalogue(self):
        self.assertEqual(len(mod.get_catalogue()), 2)
        self.assertEqual(mod.get_catalogue()[0]['nombre'], 'Lector Fácil')

    def test_baseline_no_drafts(self):
        with patch.object(mod, 'get_release', side_effect=lambda repo: self.releases[repo]), \
             patch.object(mod, 'create_draft') as create:
            mod.run()
            create.assert_not_called()
        self.assertTrue(mod.read_state()['initialized'])
        self.assertEqual(mod.read_state()['repos']['pastranaalex-glitch/lector-facil']['ultima_release_id'], 101)

    def test_one_update_and_no_repeat(self):
        with patch.object(mod, 'get_release', side_effect=lambda repo: self.releases[repo]), \
             patch.object(mod, 'create_draft') as create:
            mod.run()
            self.releases['pastranaalex-glitch/lector-facil'] = self.release(102,'v1.1')
            mod.run()
            self.assertEqual(create.call_count, 1)
            self.assertEqual(create.call_args.args[2], 'actualizacion')
            mod.run()
            self.assertEqual(create.call_count, 1)

    def test_new_app(self):
        with patch.object(mod, 'get_release', side_effect=lambda repo: self.releases[repo]), \
             patch.object(mod, 'create_draft') as create:
            mod.run()
            self.releases['pastranaalex-glitch/nueva-app'] = self.release(333,'v1.0')
            self.catalogue['aplicaciones'].append(
                {'nombre': 'Nueva App', 'slug': 'nueva-app', 'publicado': True,
                 'repo': 'pastranaalex-glitch/nueva-app',
                 'enlace': 'https://pastranaalex-glitch.github.io/nueva-app.html'})
            self.save_catalogue()
            mod.run()
            self.assertEqual(create.call_count, 1)
            self.assertEqual(create.call_args.args[2], 'nueva')

    def test_shared_repository_and_unpublished_apps_are_skipped(self):
        self.catalogue['aplicaciones'] += [
            {'nombre': 'En Familia', 'slug': 'en-familia', 'publicado': True,
             'repo': 'pastranaalex-glitch/pastranaalex-glitch.github.io',
             'enlace': 'https://pastranaalex-glitch.github.io/en-familia.html'},
            {'nombre': 'Aún no publicada', 'slug': 'pendiente', 'publicado': False,
             'repo': 'pastranaalex-glitch/pendiente',
             'enlace': 'https://pastranaalex-glitch.github.io/pendiente.html'}]
        self.save_catalogue()
        self.assertEqual(len(mod.get_catalogue()), 2)

    def test_duplicate_repository_rejected(self):
        self.catalogue['aplicaciones'].append(
            {'nombre': 'Otra ficha', 'slug': 'otra-ficha', 'publicado': True,
             'repo': 'pastranaalex-glitch/lector-facil',
             'enlace': 'https://pastranaalex-glitch.github.io/otra-ficha.html'})
        self.save_catalogue()
        with self.assertRaisesRegex(ValueError, 'duplicados'):
            mod.get_catalogue()

    def test_external_ficha_rejected(self):
        self.catalogue['aplicaciones'][0]['enlace'] = 'https://example.org/lector-facil.html'
        self.save_catalogue()
        with self.assertRaisesRegex(ValueError, 'Enlace de ficha'):
            mod.get_catalogue()

    def test_email_escaping_and_unsubscribe(self):
        app = mod.get_catalogue()[0]
        release = self.release(4, 'v2')
        release['body'] = '<script>alert(1)</script> **Nuevo** <b>rápido</b>'
        content = mod.render_email(app, release, 'actualizacion')
        self.assertNotIn('<script>', content)
        self.assertIn('{{ unsubscribe }}', content)
        self.assertIn('lector-facil.html', content)
        self.assertNotIn('%%APP%%', content)

    def test_dry_run_no_state_or_campaign(self):
        with patch.object(mod, 'get_release', side_effect=lambda repo: self.releases[repo]), \
             patch.object(mod, 'create_draft') as create:
            mod.run(dry_run=True)
            self.assertFalse(mod.STATE_FILE.exists())
            create.assert_not_called()


    def test_shared_release_uses_exact_tag_and_sha(self):
        repo = 'pastranaalex-glitch/pastranaalex-glitch.github.io'
        digest = 'a' * 64
        self.catalogue['aplicaciones'].append({
            'nombre': 'App Compartida', 'slug': 'app-compartida', 'publicado': True,
            'repo': repo,
            'enlace': 'https://pastranaalex-glitch.github.io/app-compartida.html',
            'version': '2.0.0',
            'descarga': {'version': '2.0.0', 'tag': 'app-compartida-v2.0.0',
                         'archivo': 'AppCompartida-v2.0.0.apk', 'sha256': digest}
        })
        self.save_catalogue()
        app = next(a for a in mod.get_catalogue() if a.get('slug') == 'app-compartida')
        self.assertEqual(app['mode'], 'shared-release')
        self.assertEqual(app['key'], repo + '#app-compartida')
        release = {
            'id': 1234, 'tag_name': 'app-compartida-v2.0.0',
            'draft': False, 'prerelease': False,
            'html_url': 'https://github.com/' + repo + '/releases/tag/app-compartida-v2.0.0',
            'assets': [{'state': 'uploaded', 'name': 'AppCompartida-v2.0.0.apk',
                        'digest': 'sha256:' + digest,
                        'browser_download_url': 'https://github.com/' + repo
                        + '/releases/download/app-compartida-v2.0.0/AppCompartida-v2.0.0.apk'}]
        }
        with patch.object(mod, 'request_json', return_value=release):
            self.assertEqual(mod.get_release_for_app(app)['id'], 1234)
            release['assets'][0]['digest'] = 'sha256:' + ('b' * 64)
            self.assertIsNone(mod.get_release_for_app(app))

    def test_shared_direct_requires_approved_real_apk(self):
        import json
        filename = 'MiDineroReal2_2.5.1_Publicacion_Firmada.apk'
        sha = 'c7f35b29e0fa46ccf91c349ca53360dd9c204f988eabcf8c6eed3a30eff9d69c'
        self.catalogue['aplicaciones'].append({
            'nombre': 'Mi Dinero Real 2', 'slug': 'mi-dinero-real',
            'publicado': True, 'version': '2.5.1',
            'repo': 'pastranaalex-glitch/pastranaalex-glitch.github.io',
            'enlace': 'https://pastranaalex-glitch.github.io/mi-dinero-real.html',
            'descargaDirecta': {'version': '2.5.1', 'archivo': filename, 'sha256': sha}
        })
        self.save_catalogue()
        (self.root / 'proximas-apps.json').write_text(json.dumps({'aplicaciones': [{
            'slug': 'mi-dinero-real', 'publicacionAutomatica': True,
            'revisionAprobada': True, 'sha256Aprobado': sha,
            'versionAprobada': '2.5.1'
        }]}), encoding='utf-8')
        shutil.copyfile(ROOT / filename, self.root / filename)
        app = next(a for a in mod.get_catalogue() if a.get('slug') == 'mi-dinero-real')
        release = mod.get_release_for_app(app)
        self.assertIsNotNone(release)
        self.assertEqual(release['tag_name'], 'v2.5.1')
        self.assertEqual(release['html_url'], app['ficha'])
        (self.root / filename).write_bytes(b'alterado' * 2000)
        self.assertIsNone(mod.get_release_for_app(app))


if __name__ == '__main__': unittest.main()
