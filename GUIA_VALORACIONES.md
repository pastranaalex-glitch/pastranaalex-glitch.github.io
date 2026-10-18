# Valoraciones por estrellas sin actualizar las apps

La portada y el catálogo están preparados, pero los botones permanecen inactivos
hasta configurar el servicio Cloudflare. No se muestran valoraciones ficticias.

- Un voto activo por navegador y aplicación. Votar otra vez cambia la nota, no suma votos.
- Si votan con 1 o 2 estrellas, aparece el enlace opcional a Google Forms.
- No se necesita cuenta ni correo. No se comprueba la instalación de un APK.
- Se usa Cloudflare Workers + D1 + Turnstile con protección antiabuso.
- La URL del servidor y la clave pública se configuran en valoraciones-config.json.
- Los secretos nunca se ponen en GitHub ni se comparten por chat.
- No hay anuncios, envíos de correo ni pagos asociados al sistema.

## Configuración inicial (solo una vez)

En tu ordenador, dentro de la carpeta valoraciones-worker del repositorio,
abre una terminal con Node.js instalado.

1. Ejecuta: npx wrangler login
2. Ejecuta: npx wrangler d1 create biblioteca-valoraciones
3. Copia el UUID que obtengas en la variable database_id de wrangler.toml,
   reemplazando REEMPLAZAR_CON_UUID_DE_D1.
4. Ejecuta: npx wrangler d1 migrations apply biblioteca-valoraciones --remote
5. En el panel Cloudflare, sección Turnstile, crea un widget Managed para
   pastranaalex-glitch.github.io. Copia su sitekey pública.
6. Ejecuta: npx wrangler secret put TURNSTILE_SECRET
   Cuando la terminal la pida, pega la SECRET KEY PRIVADA del widget.
7. Genera una clave de 32 bytes aleatorios (64 caracteres hexadecimales) y
   ejecútalo: npx wrangler secret put VOTE_HASH_KEY
   Nunca reutilices una contraseña personal.
8. Ejecuta: npx wrangler deploy
9. Abre valoraciones-config.json y coloca la URL HTTPS mostrada por Cloudflare
   en apiUrl y la sitekey PÚBLICA en turnstileSiteKey.
10. Sube el archivo de configuración corregido a GitHub Pages.

La web solo activa los botones si la API confirma que los secretos están
configurados. La parte de diseño y el código del voto se pueden publicar antes.

## Verificaciones

- Abre el catálogo: cada app debe mostrar la media y el número de votos.
- Vota 3 estrellas en una app y vuelve a votar 5 en el mismo navegador:
  el número de votos NO debe pasar de 1 a 2.
- Vota en una app distinta: se cuenta otro voto independiente.
- Da 1 o 2 estrellas: debe ofrecer el formulario, sin obligar a abrirlo.
- Revisa en móvil. Si no se guardan votos, mira los logs del Worker.
- El menú y las descargas deben seguir funcionando como antes.

Para nuevas aplicaciones, añade el slug publicado al conjunto APPS del
archivo valoraciones-worker/src/index.js y despliega el Worker de nuevo.

## Limitaciones

No es posible garantizar una persona única entre navegadores o dispositivos.
Si alguien borra el almacenamiento local y supera Turnstile, puede votar otra vez.
El sistema frena abusos, pero no certifica descargas ni instalaciones.
El plan gratuito está sujeto a los límites vigentes de Cloudflare.

## Documentación

https://developers.cloudflare.com/d1/reference/migrations/
https://developers.cloudflare.com/turnstile/get-started/
https://developers.cloudflare.com/workers/wrangler/configuration/
