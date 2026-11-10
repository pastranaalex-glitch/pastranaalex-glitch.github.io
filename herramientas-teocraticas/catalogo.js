/*
  CATÁLOGO v11.1 PREPARADO PARA PUBLICACIÓN EN GITHUB PAGES.
  Las tres versiones descargables han sido aportadas por el propietario.
  Las rutas siguen siendo relativas a la carpeta web, también tras su publicación.
*/
window.CATALOGO_HT = [
  {
    id: "mis-horas-predicacion", nombre: "Mis Horas de Predicación",
    categoria: "predicacion", plataforma: "android", estado: "publicado",
    icono: "clock", imagen: "imagenes/mis_horas_predicacion.png", color: "sage",
    subtitulo: "Registra tu tiempo desde el móvil, de forma sencilla",
    descripcion: "Controla el tiempo de predicación desde Android, guarda las salidas y consulta tus horas por mes o año de servicio. Puedes utilizarla sola o pasar tus registros a Panel del Precursor en Windows mediante un archivo JSON, sin cuentas ni sincronización por Internet.",
    funciones: ["Cronómetro que continúa con la pantalla bloqueada", "Registro de horas y minutos e informes", "Metas mensuales y precursorado auxiliar continuo", "Año de servicio y arrastre de minutos", "Importación y exportación de archivos con Windows", "Widget con controles del cronómetro"],
    ficha: [
      {titulo:"Registrar tiempo", puntos:["Inicia, pausa o detén el cronómetro y guarda el tiempo de predicación.", "Consulta los registros anteriores y sus informes sin perder de vista el total mensual.", "El widget permite manejar el cronómetro desde la pantalla de inicio."]},
      {titulo:"Metas e informes", puntos:["Consulta las horas de cada mes y del año de servicio (de septiembre a agosto).", "Establece metas mensuales y, si corresponde, activa el precursorado auxiliar continuo de 30 horas.", "El arrastre de minutos permite llevar los minutos pendientes al período siguiente."]},
      {titulo:"Tus datos, bajo tu control", puntos:["Exporta tus registros para consultarlos en Panel del Precursor de Windows.", "También puedes importar al móvil un archivo JSON generado desde ese programa.", "No es una sincronización automática: el intercambio se hace manualmente por archivo, sin necesidad de Internet."]}
    ],
    relacionado: "panel-del-precursor",
    relacionTitulo: "Una pareja práctica: móvil + ordenador",
    relacionDescripcion: "Mis Horas registra las salidas en Android; Panel del Precursor permite organizarlas y consultarlas con más espacio en Windows. Envía un archivo JSON desde uno e impórtalo en el otro cuando quieras, sin cuentas ni conexión a un servidor.",
    version: "1.5.0", pack: "7.7", fecha: "", archivo: "descargas/MisHorasPredicacion_1.5.0_Pack7.7.apk"
  },
  {
    id: "panel-del-precursor", nombre: "Panel del Precursor",
    categoria: "predicacion", plataforma: "windows", estado: "publicado",
    icono: "notebook", color: "blue",
    subtitulo: "Planificación, informes y registros desde el ordenador",
    descripcion: "Organiza el tiempo de predicación en Windows con cronómetro, historial, metas, calendario e informes. Incluye herramientas para planificar salidas y llevar un control de cartas, vídeos y revisitas. Se complementa con Mis Horas de Predicación para Android mediante archivos JSON.",
    funciones: ["Registro de tiempo y cronómetro", "Calendario y planificación de salidas", "Informes mensuales y del año de servicio", "Cartas, vídeos, revisitas y estudios", "Copias de seguridad y papelera", "Intercambio de datos con la aplicación Android"],
    ficha: [
      {titulo:"Horas y planificación", puntos:["Registra salidas con fecha, tiempo, tipo de predicación y, de forma opcional, notas.", "Planifica próximas salidas con el calendario y conviértelas en registros realizados.", "Revisa metas, ritmo y progreso mediante informes por mes o año de servicio."]},
      {titulo:"Herramientas de organización", puntos:["Lleva el control de cartas preparadas, pendientes, enviadas o respondidas.", "Organiza materiales y registros de vídeos relacionados con la predicación.", "Puedes llevar el seguimiento personal de revisitas y estudios; estos datos permanecen en el ordenador."]},
      {titulo:"Seguridad y traslado", puntos:["Incluye copias de seguridad, restauración y papelera interna.", "Importa las horas exportadas desde Mis Horas de Predicación en Android.", "Genera un archivo JSON para devolver los registros al móvil sin Internet."]}
    ],
    relacionado: "mis-horas-predicacion",
    relacionTitulo: "Complemento de Mis Horas de Predicación",
    relacionDescripcion: "Anota el tiempo en el móvil durante la actividad y pasa después las horas al programa de Windows. También puedes exportarlas desde el ordenador para recuperarlas en Android. La transferencia es manual y utiliza un archivo JSON; no comparte automáticamente los datos.",
    version: "2.1.1", pack: "23.2", fecha: "", archivo: "descargas/PanelDelPrecursor_Setup_2.1.1.exe"
  },
  {
    id: "reloj-reuniones", nombre: "Reloj de Reuniones PRO",
    categoria: "reuniones", plataforma: "android", estado: "en-revision",
    icono: "clock", color: "sage",
    subtitulo: "Control del tiempo de cada parte",
    descripcion: "Cronómetro para reuniones, con cuenta atrás por asignación, tiempo excedido y programa semanal. Pendiente de revisión completa antes de distribuirlo.",
    funciones: ["Cuenta atrás por parte", "Tiempo excedido visible", "Programa de reuniones con horarios", "Avisos visuales sin alarmas"],
    version: "", pack: "", fecha: "", archivo: ""
  },
  {
    id: "lector-facil", nombre: "Lector Fácil",
    categoria: "estudio", plataforma: "android", estado: "publicado",
    icono: "book", color: "lavender",
    subtitulo: "Lee PDF y Word, prepara exposiciones y adapta la lectura",
    descripcion: "Lector de documentos PDF y Word (DOCX) para Android, pensado para leer con comodidad y preparar intervenciones. Permite adaptar el tamaño del texto, buscar, marcar el punto de lectura y utilizar herramientas como OCR, teleprompter o guía de exposición.",
    funciones: ["PDF y Word (DOCX) con opciones de lectura", "Texto adaptable, zoom y tamaño de letra", "OCR para recuperar texto de PDF escaneados", "Marcadores, búsquedas y documentos recientes", "Lectura en voz alta y teleprompter", "Modo asignación y guía de exposición", "Preparación y envío de una parte para un compañero", "Alto contraste, brillo y ajustes antirreflejos"],
    ficha: [
      {titulo:"Leer a tu manera", puntos:["Abre documentos PDF y Word (DOCX) desde el móvil o la tableta.", "Amplía las páginas con zoom o utiliza Texto adaptable para ajustar los párrafos a la pantalla.", "Personaliza el tamaño de letra, el contraste y el brillo para leer con comodidad."]},
      {titulo:"Encontrar y retomar", puntos:["Busca palabras o fragmentos dentro del documento.", "Utiliza marcadores y vuelve al punto donde estabas leyendo.", "Accede de nuevo a documentos recientes sin tener que buscarlos desde cero."]},
      {titulo:"Leer y preparar asignaciones", puntos:["Escucha el texto mediante lectura en voz alta cuando el contenido lo permite.", "Utiliza el teleprompter con desplazamiento automático y control de velocidad.", "Prepara una guía de exposición y utiliza el modo asignación con ayudas visuales para seguir el texto.", "Prepara versiones para compartir con un compañero y localizar su intervención, con opciones de PDF y Word."]},
      {titulo:"PDF escaneados y funcionamiento sin conexión", puntos:["Puede aplicar reconocimiento OCR a PDF que no contienen texto seleccionable, dentro de sus límites técnicos.", "La lectura y el OCR funcionan sin conexión; la consulta opcional de actualizaciones sí requiere Internet.", "Gratuita, sin anuncios ni compras dentro de la aplicación."]}
    ],
    version: "1.0.5", pack: "", fecha: "", archivo: "descargas/LectorFacil-v1.0.5.apk"
  },
  {
    id: "organizador-reuniones-pro", nombre: "Organizador de Reuniones PRO",
    categoria: "reuniones", plataforma: "windows", estado: "publicado",
    icono: "calendar", color: "blue",
    subtitulo: "Organiza reuniones y reparte las asignaciones de forma equilibrada",
    descripcion: "Programa gratuito para Windows que ayuda a preparar las reuniones de entre semana y del fin de semana. Permite gestionar participantes y autorizaciones, consultar el catálogo de 196 números de discursos, importar la Guía de actividades, elaborar borradores editables y preparar programas finales. Propone asignaciones teniendo en cuenta el historial y las personas elegibles, siempre con revisión manual.",
    funciones: ["Fichas de participantes, responsabilidades y autorizaciones", "Importación local de la Guía de actividades en EPUB", "Borradores que permiten añadir, quitar y reordenar partes", "Propuestas de reparto con controles de repetición y disponibilidad", "Programación de una o dos salas y fechas especiales", "Programa final, informes, historial y exportación a PDF", "Copias de seguridad y contraseña opcional"],
    ficha: [
      {titulo:"Preparar el programa", puntos:["Introduce los datos de los participantes, su disponibilidad y las asignaciones autorizadas.", "Importa la Guía de actividades desde un archivo EPUB local y comprueba sus partes y duraciones.", "Edita el borrador según las circunstancias de cada semana: añade, quita, sustituye o cambia el orden de las partes."]},
      {titulo:"Repartir las asignaciones", puntos:["Genera propuestas de participantes y ayudantes según los requisitos de cada asignación.", "Consulta el historial para reducir repeticiones excesivamente próximas y procurar un reparto equilibrado.", "Revisa los resultados y cambia manualmente cualquier asignación antes de confirmar el programa."]},
      {titulo:"Revisar e imprimir", puntos:["Prepara programas con horarios, incluidas reuniones con dos salas cuando corresponda.", "Gestiona fechas especiales y sustituciones sin tener que rehacer todas las semanas.", "Confirma programas, revisa el historial y prepara documentos PDF para imprimir."]},
      {titulo:"Datos privados y actualizaciones", puntos:["Los datos de participantes y reuniones se guardan localmente en el ordenador.", "Incluye copias de seguridad y una contraseña opcional.", "Las actualizaciones automáticas aún no están activadas. Las nuevas versiones se distribuyen manualmente."]}
    ],
    version: "0.8.9.3", pack: "8.9.3", fecha: "", archivo: "https://github.com/pastranaalex-glitch/pastranaalex-glitch.github.io/releases/download/organizador-reuniones-v0.8.9.3/Organizador_Reuniones_PRO_8_9_3_WINDOWS_PARA_WEB.1.zip"
  },
  {
    id: "responsabilidades", nombre: "Mis Responsabilidades Teocráticas",
    categoria: "organizacion", plataforma: "android", estado: "en-revision",
    icono: "calendar", color: "sand",
    subtitulo: "Compromisos y asignaciones organizados",
    descripcion: "Herramienta para llevar un control personal de responsabilidades y asignaciones. La ficha está preparada para revisar la versión existente antes de publicarla.",
    funciones: ["Organización personal", "Control de responsabilidades", "Consulta de asignaciones", "Revisión de estabilidad pendiente"],
    version: "", pack: "", fecha: "", archivo: ""
  }
];
