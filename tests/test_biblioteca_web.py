"""Comprobaciones sin dependencias externas para la Biblioteca (GitHub Pages)."""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://pastranaalex-glitch.github.io/"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.canonicals = []
        self.titles = 0
        self.descriptions = 0
        self.images_without_size = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.titles += 1
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.descriptions += 1
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonicals.append(attrs.get("href"))
        for key in ("href", "src", "poster"):
            if attrs.get(key):
                self.references.append(attrs[key])
        if tag == "img" and ("width" not in attrs or "height" not in attrs):
            # El visor de imágenes utiliza un <img> vacío y oculto hasta abrirse.
            if attrs.get("id") not in ("bigshot", "rutas-bigshot", "lightbox-image", "docs-bigshot"):
                self.images_without_size.append(attrs.get("src", "<sin src>"))


def parse_page(path):
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    return parser


class BibliotecaWebTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalogue = json.loads((ROOT / "catalogo.json").read_text(encoding="utf-8"))
        xml = ET.parse(ROOT / "sitemap.xml")
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        cls.sitemap = [el.text for el in xml.findall(".//sm:loc", ns)]
        cls.text_sitemap = (ROOT / "sitemap.txt").read_text(encoding="utf-8").splitlines()

    def test_sitemaps_consistent(self):
        self.assertEqual(self.sitemap, self.text_sitemap)
        self.assertEqual(len(self.sitemap), len(set(self.sitemap)))
        self.assertIn(BASE, self.sitemap)
        for url in self.sitemap:
            self.assertTrue(url.startswith(BASE), url)
            filename = url.removeprefix(BASE) or "index.html"
            self.assertTrue((ROOT / filename).is_file(), url)

    def test_published_apps_have_public_page_and_sitemap(self):
        for app in self.catalogue["aplicaciones"]:
            if not app.get("publicado"):
                continue
            slug = app["slug"]
            with self.subTest(slug=slug):
                self.assertIn(BASE + slug + ".html", self.sitemap)
                self.assertTrue((ROOT / (slug + ".html")).is_file())
                self.assertEqual(app["version"], app["descarga"]["version"])
                self.assertEqual(app["enlace"], BASE + slug + ".html")
                self.assertRegex(app["descarga"]["sha256"], r"^[0-9a-f]{64}$")
                expected = ("https://github.com/" + app["repo"] + "/releases/download/"
                            + app["descarga"]["tag"] + "/" + app["descarga"]["archivo"])
                page_text = (ROOT / (slug + ".html")).read_text(encoding="utf-8")
                # Sudoku y Sopa de Letras verifican el enlace por JavaScript tras validar el APK.
                if slug not in ("sudoku-vivo", "sopa-de-letras-pro"):
                    self.assertIn(expected, page_text, "La ficha no ofrece el archivo publicado")
                for url in re.findall(r"https://github[.]com/[A-Za-z0-9._/-]+/releases/download/[A-Za-z0-9._()-]+/[A-Za-z0-9._()-]+", page_text):
                    if ("/releases/download/" + app["descarga"]["tag"] + "/") in url:
                        self.assertEqual(url, expected, "Descarga incorrecta para versión actual")

    def test_local_assets_and_links_exist(self):
        for page in sorted(ROOT.glob("*.html")):
            if page.name.startswith("google"):
                continue
            parser = parse_page(page)
            for raw in parser.references:
                parts = urlsplit(raw.strip())
                if parts.scheme or parts.netloc or not parts.path:
                    continue
                local = unquote(parts.path).lstrip("/")
                if not local or local.startswith("../"):
                    continue
                with self.subTest(page=page.name, reference=raw):
                    self.assertTrue((ROOT / local).exists(), f"{page.name}: enlace inexistente {raw}")

    def test_pages_indexed_have_metadata(self):
        for url in self.sitemap:
            page_name = url.removeprefix(BASE) or "index.html"
            page = ROOT / page_name
            if not page_name.endswith(".html"):
                continue
            with self.subTest(page=page_name):
                parser = parse_page(page)
                self.assertEqual(parser.titles, 1, "Debe existir un título")
                self.assertGreaterEqual(parser.descriptions, 1, "Falta descripción")
                self.assertIn(url, parser.canonicals, "Canonical inconsistente")

    def test_portada_images_reserve_space(self):
        parser = parse_page(ROOT / "index.html")
        self.assertFalse(parser.images_without_size, parser.images_without_size)

    def test_contador_texto_facil(self):
        app = next(a for a in self.catalogue["aplicaciones"] if a["slug"] == "texto-facil")
        fallback = json.loads((ROOT / "texto-facil-descargas.json").read_text(encoding="utf-8"))
        self.assertEqual(fallback["slug"], app["slug"])
        for key in ("tag", "archivo", "sha256"):
            self.assertEqual(fallback[key], app["descarga"][key])
        self.assertRegex(fallback["fecha"], r"^\d{4}-\d{2}-\d{2}$")
        self.assertIsInstance(fallback["conteoMinimoConfirmado"], int)
        self.assertGreaterEqual(fallback["conteoMinimoConfirmado"], 0)
        page = (ROOT / "texto-facil.html").read_text(encoding="utf-8")
        js = (ROOT / "pack6.js").read_text(encoding="utf-8")
        self.assertIn("texto-facil-descargas.json", page)
        self.assertIn("texto-facil-descargas.json", js)
        self.assertIn("case 'texto-facil':return", js)
        self.assertIn("item.download_count", page)
        self.assertIn('tf-download-count', page)

    def test_no_duplicate_homepage(self):
        self.assertFalse((ROOT / "index (1).html").exists())


if __name__ == "__main__":
    unittest.main()
