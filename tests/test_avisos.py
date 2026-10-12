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
        # Utilizar un catálogo mínimo reproducible para las pruebas unitarias.
        # No depende de las fichas reales, que pueden crecer con nuevas apps.
        (self.root / 'index.html').write_text('''<article data-app-card data-repo="pastranaalex-glitch/lector-facil"><h3>Lector Fácil</h3><a href="lector-facil.html">Ficha</a></article>
<article data-app-card data-repo="pastranaalex-glitch/cocina-clara"><h3>Cocina Clara</h3><a href="cocina-clara.html">Ficha</a></article>''', encoding='utf-8')
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
            (self.root / 'index.html').write_text((self.root / 'index.html').read_text(encoding='utf-8') +
                '\n<article data-app-card data-repo="pastranaalex-glitch/nueva-app"><h3>Nueva App</h3><a href="nueva-app.html">Ficha</a></article>', encoding='utf-8')
            mod.run()
            self.assertEqual(create.call_count, 1)
            self.assertEqual(create.call_args.args[2], 'nueva')

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

if __name__ == '__main__': unittest.main()
