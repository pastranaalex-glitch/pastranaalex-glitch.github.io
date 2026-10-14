import importlib.util
import unittest
from pathlib import Path
from unittest.mock import patch

MOD = Path(__file__).resolve().parent.parent / "scripts" / "publicar_aprobadas.py"
spec = importlib.util.spec_from_file_location("publicar_aprobadas", MOD)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class PublishSafetyTests(unittest.TestCase):
    def setUp(self):
        self.app = {
            "repo": "pastranaalex-glitch/mi-salud-familiar",
            "versionAprobada": "v1.0.0", "plataforma": "android"
        }
        self.release = {
            "draft": False, "prerelease": False, "tag_name": "v1.0.0",
            "assets": [{"state": "uploaded", "name": "app-release.apk", "size": 500000,
                        "browser_download_url": "https://github.com/pastranaalex-glitch/mi-salud-familiar/releases/download/v1.0.0/app-release.apk"}]
        }
    def test_release_aprobada(self):
        self.assertTrue(mod.valid_release(self.app, self.release))
    def test_debug_rechazado(self):
        self.release["assets"][0]["name"] = "app-debug.apk"
        self.assertFalse(mod.valid_release(self.app, self.release))
    def test_borrador_rechazado(self):
        self.release["draft"] = True
        self.assertFalse(mod.valid_release(self.app, self.release))
    def test_repo_distinto_rechazado(self):
        self.release["assets"][0]["browser_download_url"] = "https://github.com/otro/mi-salud-familiar/releases/download/v1.0.0/app-release.apk"
        self.assertFalse(mod.valid_release(self.app, self.release))

if __name__ == "__main__":
    unittest.main()
