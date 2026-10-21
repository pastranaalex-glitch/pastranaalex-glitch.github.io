import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import re
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("publicar_jardin_186", ROOT / "scripts/publicar_jardin_186.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
FILES = ("catalogo.json", "proximas-apps.json", "jardin-de-joyas.html", "index.html")


class JardinPublicationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        for name in FILES:
            (self.base / name).write_bytes((ROOT / name).read_bytes())
        # La prueba sigue partiendo de una actualización pendiente después de publicar.
        catalogue = json.loads((self.base / "catalogo.json").read_text())
        next(a for a in catalogue["aplicaciones"] if a["slug"] == mod.SLUG)["version"] = "1.7.5"
        (self.base / "catalogo.json").write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n")
        for name in ("jardin-de-joyas.html", "index.html"):
            p = self.base / name
            p.write_text(p.read_text().replace(mod.VERSION, "1.7.5"))
        self.config = json.loads((self.base / "proximas-apps.json").read_text())
        app = next(a for a in self.config["aplicaciones"] if a["slug"] == mod.SLUG)
        app.update(repo=mod.REPO, versionAprobada=mod.TAG, versionVisible=mod.VERSION,
                   archivoAprobado=mod.FILENAME, sha256Aprobado=mod.SHA256,
                   revisionAprobada=True, publicacionAutomatica=True, apkSubido=False)
        (self.base / "proximas-apps.json").write_text(json.dumps(self.config, ensure_ascii=False, indent=2) + "\n")
        self.before = self.snapshot()
        self.asset = {"name": mod.FILENAME, "size": mod.SIZE, "state": "uploaded",
                      "browser_download_url": mod.DOWNLOAD, "digest": "sha256:" + mod.SHA256}
        self.release = {"tag_name": mod.TAG, "draft": False, "prerelease": False,
                        "assets": [self.asset]}

    def snapshot(self):
        return {n: (self.base / n).read_bytes() for n in FILES}

    def test_esperar_sin_release_no_modifica_la_web(self):
        with patch.object(mod, "get_release", return_value=None), patch.object(mod, "verify_asset") as verify:
            self.assertEqual(mod.publish(self.base), [])
            verify.assert_not_called()
        self.assertEqual(self.before, self.snapshot())

    def test_rechazar_borradores_preversiones_y_otra_etiqueta(self):
        for key, value in (("draft", True), ("prerelease", True), ("tag_name", "v1.8.6")):
            with self.subTest(key=key):
                release = copy.deepcopy(self.release)
                release[key] = value
                with patch.object(mod, "get_release", return_value=release), patch.object(mod, "verify_asset") as verify:
                    self.assertEqual(mod.publish(self.base), [])
                    verify.assert_not_called()
                self.assertEqual(self.before, self.snapshot())

    def test_rechazar_otra_apk_tamano_estado_url_o_digest(self):
        for key, value in (("name", "app.apk"), ("size", mod.SIZE - 1), ("state", "new"),
                           ("browser_download_url", mod.DOWNLOAD.replace(mod.REPO, "otro/repo")),
                           ("digest", "sha256:" + "0" * 64)):
            with self.subTest(key=key):
                release = copy.deepcopy(self.release)
                release["assets"][0][key] = value
                with patch.object(mod, "get_release", return_value=release), patch.object(mod, "verify_asset") as verify:
                    self.assertEqual(mod.publish(self.base), [])
                    verify.assert_not_called()
                self.assertEqual(self.before, self.snapshot())

    def test_no_escribir_si_falla_la_comprobacion_del_archivo(self):
        with patch.object(mod, "get_release", return_value=self.release), patch.object(mod, "verify_asset", side_effect=ValueError("hash distinto")):
            with self.assertRaises(ValueError):
                mod.publish(self.base)
        self.assertEqual(self.before, self.snapshot())

    def test_hash_real_y_tamano_del_archivo_descargado(self):
        good = b"APK aprobada para prueba"
        with patch.object(mod, "SIZE", len(good)), patch.object(mod, "SHA256", hashlib.sha256(good).hexdigest()):
            with patch.object(mod, "urlopen", return_value=io.BytesIO(good)):
                mod.verify_asset(self.asset)
            with patch.object(mod, "urlopen", return_value=io.BytesIO(b"x" * len(good))):
                with self.assertRaises(ValueError):
                    mod.verify_asset(self.asset)
            with patch.object(mod, "urlopen", return_value=io.BytesIO(good + b"x")):
                with self.assertRaises(ValueError):
                    mod.verify_asset(self.asset)

    def test_publicar_preserva_otras_apps_y_es_idempotente(self):
        with patch.object(mod, "get_release", return_value=self.release), patch.object(mod, "verify_asset") as verify:
            self.assertEqual(set(mod.publish(self.base)), set(FILES))
            verify.assert_called_once_with(self.asset)
        after = json.loads((self.base / "catalogo.json").read_text())
        before = json.loads(self.before["catalogo.json"])
        others = lambda data: [a for a in data["aplicaciones"] if a.get("slug") != mod.SLUG]
        self.assertEqual(others(after), others(before))
        self.assertEqual(others(json.loads((self.base / "proximas-apps.json").read_text())), others(self.config))
        app = next(a for a in after["aplicaciones"] if a["slug"] == mod.SLUG)
        self.assertEqual(app["version"], mod.VERSION)
        self.assertEqual(app["descarga"]["sha256"], mod.SHA256)
        self.assertNotIn("anuncioActualizacion", app)
        detail = (self.base / "jardin-de-joyas.html").read_text()
        self.assertIn(mod.DOWNLOAD, detail)
        self.assertIn(mod.SHA256, detail)
        self.assertIn("Ocho melodías relajantes", detail)
        self.assertIn("Flores de Oro y semillas especiales", detail)
        self.assertIn("Versión anterior 1.7.5", detail)
        self.assertNotIn("500 niveles", detail)
        self.assertNotIn("Esta versión ha sido probada en Android", detail)
        self.assertIn('href="jardin-joyas-inicio.jpg"', detail)
        home = (self.base / "index.html").read_text()
        pattern = r'<article class="biblio-news-card biblio-news-card--lector".*?</article>'
        self.assertEqual(re.search(pattern, home, re.S).group(), re.search(pattern, self.before["index.html"].decode(), re.S).group())
        with patch.object(mod, "get_release") as get, patch.object(mod, "verify_asset") as verify:
            self.assertEqual(mod.publish(self.base), [])
            get.assert_not_called()
            verify.assert_not_called()

    def test_no_retroceder_una_version_futura(self):
        data = json.loads((self.base / "catalogo.json").read_text())
        next(a for a in data["aplicaciones"] if a["slug"] == mod.SLUG)["version"] = "1.9.0"
        (self.base / "catalogo.json").write_text(json.dumps(data))
        before = self.snapshot()
        with patch.object(mod, "get_release") as get:
            self.assertEqual(mod.publish(self.base), [])
            get.assert_not_called()
        self.assertEqual(before, self.snapshot())

    def test_no_actuar_con_otra_aprobacion(self):
        next(a for a in self.config["aplicaciones"] if a["slug"] == mod.SLUG)["sha256Aprobado"] = "0" * 64
        (self.base / "proximas-apps.json").write_text(json.dumps(self.config))
        before = self.snapshot()
        with patch.object(mod, "get_release") as get:
            self.assertEqual(mod.publish(self.base), [])
            get.assert_not_called()
        self.assertEqual(before, self.snapshot())

    def test_detenerse_si_cambia_la_estructura_html(self):
        (self.base / "index.html").write_text("<html><body>Otra portada</body></html>")
        before = self.snapshot()
        with patch.object(mod, "get_release") as get:
            with self.assertRaises(ValueError):
                mod.publish(self.base)
            get.assert_not_called()
        self.assertEqual(before, self.snapshot())


if __name__ == "__main__":
    unittest.main()
