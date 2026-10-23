# Sudoku Vivo: compilación de Android desde GitHub

Se ha preparado un flujo de GitHub Actions para generar una APK Android de pruebas sin usar el portátil como compilador.

## Estado actual

- Proyecto de partida: **Sudoku Vivo Pack 2, versión 0.2.0**.
- Archivo de origen disponible en la conversación: **Sudoku_Vivo_PACK2_0_2_0_ANDROID.zip**.
- Flujo automático preparado en `.github/workflows/sudoku-vivo-apk.yml`.
- **Pendiente:** subir ese ZIP al nivel raíz de este repositorio con el nombre exacto `sudoku-vivo-src.zip`.
- La compilación no se considera verificada hasta que GitHub Actions la ejecute y genere la APK.

## Pasos al disponer del archivo ZIP

1. Descargar el Pack 2 original de ChatGPT.
2. Guardar una copia y cambiar el nombre del ZIP a `sudoku-vivo-src.zip` (sin extraerlo).
3. Abrir este repositorio en GitHub, usar **Add file → Upload files** y añadir el ZIP a la raíz del repositorio.
4. Confirmar la subida. El flujo `Sudoku Vivo - Compilar APK de pruebas` se iniciará al recibir el ZIP.
5. Abrir la pestaña **Actions**, seleccionar la ejecución y descargar el artefacto **SudokuVivo-Pack2-APK-Pruebas**. El archivo del artefacto es un ZIP con la APK.
6. Extraer `SudokuVivo_PACK2_Pruebas.apk` en Android y usarla para las primeras pruebas.

## Aviso sobre firma y actualizaciones

Esta primera compilación en GitHub utiliza la firma de depuración del propio ejecutor, que **no tiene por qué coincidir** con la del portátil ni con compilaciones posteriores. Android puede impedir instalarla encima de una APK existente.

Para garantizar actualizaciones sin desinstalar y sin perder las partidas será necesario elegir y custodiar una **firma permanente**. **Nunca** se debe subir la clave privada al repositorio. En el futuro podemos configurar GitHub Secrets para firmar cada versión con la misma clave privada de forma segura.

## Decisiones técnicas

- Código Java, proyecto Gradle de Android original del Pack 2.
- JDK 17, Android SDK 35 y Gradle 8.7.
- Se usa `assembleDebug` (APK de pruebas, no versión pública definitiva).
- Los artefactos de las compilaciones se conservan durante 30 días.
- No se publica ninguna APK automáticamente en el catálogo público de la Biblioteca.

Última actualización: 23 de octubre de 2026.
