# Publicación de Sudoku Vivo 0.7.0

**Estado:** ficha preparada; APK todavía pendiente de subir a GitHub Releases.

- Archivo original: `SudokuVivo_0.7.0_CANDIDATO_FIRMADO.apk`
- Identificador Android: `es.bibliotecadeherramientas.sudokuvivo`
- Versión: `0.7.0`; versionCode: `7`
- Android mínimo: 7.0 (API 24)
- SHA-256: `dff3ae105cae60e823bd2daac9ddb50389159962a389bf972b9489d9b10ec426`
- Certificado de firma, huella SHA-256: `0e7bca3400e8d41aeba8c5ef54ebd782b8e8fb89ec267efee1a555397d2a4de3`
- Firma APK v2 comprobada, con hash de contenido válido.
- Firma privada NO incorporada al repositorio.
- Página pública: https://pastranaalex-glitch.github.io/sudoku-vivo.html

## Único paso pendiente de carga binaria

1. Desde el portátil, abrir https://github.com/pastranaalex-glitch/pastranaalex-glitch.github.io/releases/new
2. Crear la etiqueta **`sudoku-vivo-v0.7.0`** desde la rama principal.
3. Título: **Sudoku Vivo 0.7.0 - Primera edición pública**.
4. Descripción: **Sudokus clásicos generados, aventura visual con nueve niveles, escuela interactiva con diez lecciones, seis temas de color, pistas de lógica y copias de progreso. Aplicación gratuita, sin anuncios.**
5. Adjuntar la APK exacta indicada arriba. No cambiarla ni volver a firmarla.
6. Publicar la versión de GitHub Releases y comprobar que el enlace de descarga funciona.

## Después de subir la APK

Comprobar la presencia, el nombre, el digest y el enlace del asset remoto en GitHub; solamente entonces:

- Poner `published:true` en `sudoku-vivo-version.json`.
- Activar `publicado:true` y `disponible:true` para Sudoku Vivo en `catalogo.json`.
- Quitar su ficha de `proximamente.html` y añadir un anuncio de disponible.
- Verificar contador de descargas y ficha en la Biblioteca.
- No anunciar una edición 1.0.0: el archivo firmado suministrado es 0.7.0.

**Firma:** guardar el archivo privado de firma permanente y su contraseña en lugar seguro. La firma v2 e integridad criptográfica son válidas, pero esto no sustituye las pruebas del Pack 7 y de restauración real en Android.
