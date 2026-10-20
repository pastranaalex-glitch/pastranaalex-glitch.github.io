#!/usr/bin/env python3
"""Verify only Mente Activa PRO's public APK before enabling its download."""
import hashlib
import os
from pathlib import Path
import re
import subprocess
import tempfile
import urllib.parse
import urllib.request
import zipfile

CERTIFICATE = "51f07d26e187b2b6ecc916f50dd04502a1a2ed5d3f1cf56f7066eca691d984bd"
REPOSITORY = "pastranaalex-glitch/pastranaalex-glitch.github.io"

def verify_approved_apk(app, release):
    if app.get("repo") != REPOSITORY or release.get("draft") or release.get("prerelease"):
        raise ValueError("Unexpected repository or unpublished release")
    tag, name = app["versionAprobada"], app["archivoAprobado"]
    if release.get("tag_name") != tag:
        raise ValueError("Unexpected release tag")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,99}", tag) or ".." in tag:
        raise ValueError("Invalid tag")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,179}\.apk", name) or ".." in name:
        raise ValueError("Invalid APK filename")
    assets = [a for a in release.get("assets", []) if a.get("name") == name and a.get("state") == "uploaded"]
    if len(assets) != 1:
        raise ValueError("Exactly one approved APK is required")
    asset = assets[0]
    digest = asset.get("digest", "")
    if not re.fullmatch(r"sha256:[a-f0-9]{64}", digest):
        raise ValueError("Missing release checksum")
    expected_url = "https://github.com/" + REPOSITORY + "/releases/download/" + urllib.parse.quote(tag, safe="") + "/" + urllib.parse.quote(name, safe="")
    if asset.get("browser_download_url") != expected_url or not 10000 < asset.get("size", 0) <= 64 * 1024 * 1024:
        raise ValueError("Invalid APK URL or size")
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if not sdk:
        raise RuntimeError("Android SDK is required to verify the APK")
    tools = [p for p in (Path(sdk) / "build-tools").glob("*") if (p / "apksigner").is_file() and (p / "aapt").is_file()]
    if not tools:
        raise RuntimeError("Android APK verification tools are unavailable")
    tools.sort(key=lambda p: tuple(int(x) for x in re.findall(r"\d+", p.name)))
    build_tools = tools[-1]
    with tempfile.TemporaryDirectory(prefix="mente-apk-") as temp:
        apk = Path(temp) / "app.apk"
        request = urllib.request.Request(expected_url, headers={"User-Agent": "Biblioteca-verificacion-APK"})
        sha = hashlib.sha256()
        total = 0
        with urllib.request.urlopen(request, timeout=30) as response, apk.open("wb") as out:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                total += len(chunk)
                if total > 64 * 1024 * 1024:
                    raise ValueError("APK exceeds size limit")
                sha.update(chunk)
                out.write(chunk)
        if total != asset["size"] or sha.hexdigest() != digest[7:]:
            raise ValueError("Downloaded APK differs from release metadata")
        run = lambda args: subprocess.check_output(args, text=True, stderr=subprocess.STDOUT, timeout=60)
        signature = run([str(build_tools / "apksigner"), "verify", "--verbose", "--print-certs", str(apk)])
        # Newer apksigner versions label signers with their supported SDK range.
        print(signature)
        certs = re.findall(r"^Signer[^\n]* certificate SHA-256 digest: ([a-f0-9]{64})\s*$", signature, re.MULTILINE)
        if not certs or set(certs) != {CERTIFICATE}:
            raise ValueError("Unexpected Mente Activa PRO signing certificate: " + ", ".join(certs))
        badging = run([str(build_tools / "aapt"), "dump", "badging", str(apk)])
        package = next((line for line in badging.splitlines() if line.startswith("package:")), "")
        if "name='es.bibliotecaherramientas.menteactiva'" not in package:
            raise ValueError("Unexpected Android application ID")
        if "versionCode='" + str(app["versionCodeAprobado"]) + "'" not in package or "versionName='" + app["versionVisible"] + "'" not in package:
            raise ValueError("Unexpected Android version")
        permissions = run([str(build_tools / "aapt"), "dump", "permissions", str(apk)])
        if re.findall(r"uses-permission: name='([^']+)'", permissions) != ["android.permission.INTERNET"]:
            raise ValueError("Unexpected Android permissions")
        with zipfile.ZipFile(apk) as z:
            if z.testzip() is not None or "assets/index.html" not in z.namelist():
                raise ValueError("Invalid APK contents")
            if any(n.lower().endswith((".jks", ".keystore", "signing.properties")) or "firma-privada/" in n.lower() for n in z.namelist()):
                raise ValueError("APK contains signing material")
    print("Mente Activa PRO APK verified: original certificate, package, version, permissions and SHA-256", digest[7:])
    return {"version": app["versionVisible"], "tag": tag, "archivo": name, "sha256": digest[7:]}
