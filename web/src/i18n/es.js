// Spanish strings. Anything missing here falls back to English, key by key.
//
// Deliberately in the "tú" register rather than "usted": LibrAPP is a personal
// tool for your own shelf, and the formal register would sound like a bank.

export default {
  // -- landing ------------------------------------------------------------
  'landing.tagline': 'Crea el catálogo completo de tus libros a partir de una foto de tu estantería.',
  'landing.intro':
    'Fotografía una estantería y LibrAPP lee los lomos para crear un catálogo que puedes buscar, filtrar y consultar. También puedes traer una hoja de cálculo, la exportación de una tienda o un catálogo que hicieras en otro dispositivo, y combinarlo todo sin duplicados.',
  'landing.privacy.title': 'Tus libros se quedan contigo',
  'landing.privacy.body':
    'No hay cuenta ni servidor. Tu catálogo se guarda en este dispositivo y no se sube nada. Una vez cargada, LibrAPP funciona sin conexión.',
  'landing.needs.title': 'Qué hace falta para que funcione',
  'landing.needs.storage':
    'Un lugar donde guardar tu catálogo: una carpeta que elijas o el almacenamiento que gestiona el navegador. Tú decides, y puedes cambiar de idea más adelante.',
  'landing.needs.source':
    'Al menos una fuente de libros: una fotografía, una lista que ya tengas o un catálogo exportado desde otro dispositivo.',
  'landing.needs.ai':
    'Leer los lomos de una fotografía necesita un asistente de IA. Puedes pegar las imágenes en el asistente que uses, o darle a LibrAPP una clave para que lo haga por ti. Todo lo demás funciona sin IA.',
  'landing.start': '¿Por dónde quieres empezar?',
  'landing.start.hint': 'Cualquiera de estas opciones configurará el almacenamiento si aún no lo has elegido.',

  'landing.option.storage': 'Quiero elegir dónde se guarda mi catálogo',
  'landing.option.storage.hint': 'Configúralo primero, antes de añadir libros.',
  'landing.option.photo': 'Tengo una foto de mi estantería',
  'landing.option.photo.hint': 'La forma más rápida de catalogar los libros que tienes en papel.',
  'landing.option.list': 'Tengo una lista de los libros que tengo',
  'landing.option.list.hint': 'Una hoja de cálculo, un CSV, un XML o la exportación de una tienda en PDF.',
  'landing.option.import': 'Tengo un catálogo de otro dispositivo',
  'landing.option.import.hint': 'Trae el archivo que exportaste desde LibrAPP en otro sitio.',
  'landing.option.browse': 'Quiero ver mi catálogo',
  'landing.option.browse.hint': 'Ir directamente a los libros que ya tienes aquí.',
  'landing.option.browse.empty': 'Aquí todavía no hay nada: empieza por una de las opciones de arriba.',

  'landing.language': 'Idioma',
  'landing.learnMore': 'Más sobre LibrAPP',
  'landing.browserWarning':
    'A este navegador le falta algo que LibrAPP necesita. Abre la pestaña Biblioteca cuando entres para ver los detalles.',

  // -- shell --------------------------------------------------------------
  'app.strapline': 'tu estantería, catalogada',
  'nav.home': 'Inicio',
  'nav.catalog': 'Catálogo',
  'nav.shelf': 'Foto de estantería',
  'nav.list': 'Subir lista',
  'nav.desk': 'La mesa del LibrAPPrio',
  'nav.library': 'Biblioteca',
  'nav.home.hint': 'la página de bienvenida',
  'nav.catalog.hint': 'todo lo que tienes',
  'nav.shelf.hint': 'leer una fotografía',
  'nav.list.hint': 'un archivo que ya tienes',
  'nav.desk.hint': 'preguntar sobre ello',
  'nav.library.hint': 'dónde se guarda',

  'sidebar.books': 'libros',
  'sidebar.authors': 'autores',
  'sidebar.read': 'leídos',
  'sidebar.unread': 'sin leer',
  'sidebar.notRecorded': 'sin constancia',
  'sidebar.noCatalog': 'Todavía no hay catálogo.',
  'sidebar.rebuild': 'Reconstruir catálogo',
  'sidebar.working': 'trabajando…',

  'common.cancel': 'Cancelar',
  'common.close': 'Cerrar',
  'common.dismiss': 'Descartar',
  'common.edit': 'Editar',
  'common.remove': 'Quitar',
  'common.restore': 'Restaurar',
  'common.undo': 'Deshacer',
  'common.import': 'Importar',
  'common.export': 'Exportar',
  'common.opening': 'Abriendo tu catálogo…',
  'common.saving': 'guardando…',
  'common.importing': 'importando…',

  // -- storage choice -----------------------------------------------------
  'setup.title': '¿Dónde quieres guardar tu catálogo?',
  'setup.intro':
    'LibrAPP guarda tu catálogo en este dispositivo y no lo envía a ninguna parte. Solo necesita saber dónde ponerlo.',
  'setup.folder.title': 'Una carpeta que elijas',
  'setup.folder.body':
    'Archivos normales que puedes abrir, copiar o guardar donde quieras. LibrAPP escribe ahí tus fuentes y tu catálogo, y nada más.',
  'setup.folder.action': 'Elegir una carpeta',
  'setup.browser.title': 'Almacenamiento del navegador',
  'setup.browser.body':
    'Nada que elegir ni configurar, pero los archivos no son visibles para otras aplicaciones: una exportación es la forma de sacar una copia de este dispositivo.',
  'setup.browser.action': 'Usar el almacenamiento del navegador',
  'setup.noPicker':
    'Este navegador no tiene selector de carpetas, lo cual es normal en un móvil. El almacenamiento del navegador funciona igual desde dentro de la aplicación.',
  'setup.either': 'Puedes cambiarlo más adelante, y mover un catálogo de uno a otro.',

  'permit.title': 'Vuelve a abrir tu catálogo',
  'permit.body':
    'El navegador necesita que confirmes de nuevo el acceso a la carpeta. Lo pide una vez por sesión y LibrAPP no puede evitarlo.',
  'permit.open': 'Abrir la carpeta',
  'permit.elsewhere': 'Elegir otro sitio',

  // -- errors -------------------------------------------------------------
  'error.noKeyActive': 'No hay ninguna clave activada.',
  'error.notAnExport':
    'Ese archivo no es una exportación de LibrAPP. Elige el archivo que exportaste desde Biblioteca → Exportar en el otro dispositivo.',
  'error.notJson': 'Ese archivo no se puede leer como JSON. Puede que se haya renombrado o descargado a medias.',
}
