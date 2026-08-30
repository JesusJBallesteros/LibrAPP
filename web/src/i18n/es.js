// Spanish strings. Anything missing here falls back to English, key by key.
//
// Deliberately in the "tú" register rather than "usted": LibrAPP is a personal
// tool for your own shelf, and the formal register would sound like a bank.

export default {
  // -- landing ------------------------------------------------------------
  'landing.tagline': 'Fotografía tus estanterías. Ten un catálogo que responde preguntas.',
  'landing.start': '¿Por dónde quieres empezar?',

  'landing.option.storage': 'Elegirlo primero',
  'landing.option.photo': 'Fotografía una estantería',
  'landing.option.photo.hint': 'La forma más rápida de catalogar los libros que tienes en papel.',
  'landing.option.list': 'Sube una lista',
  'landing.option.list.hint': 'Una hoja de cálculo, un CSV, un XML o una lista en PDF.',
  'landing.option.barcode': 'Lee códigos de barras',
  'landing.option.barcode.hint': 'Escanea o escribe el código de barras. Gratis, exacto y sin clave.',
  'landing.option.import': 'Trae un catálogo',
  'landing.option.import.hint': 'Trae el archivo que exportaste desde LibrAPP en otro sitio.',
  'landing.option.browse': 'Ver mi catálogo',
  'landing.option.browse.hint': 'Ir directamente al catálogo.',
  'landing.option.browse.count': '{n} {n:libro|libros} aquí.',
  'landing.privacyLink': 'Qué sale de este dispositivo',
  'landing.licenceName': 'PolyForm Noncommercial',
  'landing.storageFirst': 'El almacenamiento se configura por el camino.',

  'landing.demo.action': 'Prueba una biblioteca de muestra',

  'demo.banner': 'Estás viendo una biblioteca de muestra.',
  'demo.bannerWhy':
    'Estos libros son inventados. Todo funciona, incluidas las ediciones y las importaciones, y todo desaparece al recargar. Tu catálogo no se toca.',
  'demo.leave': 'Salir de la muestra',
  'demo.tryYours': 'Prueba con la tuya',
  'demo.importWarning': 'Lo que traigas aquí forma parte de la muestra.',
  'demo.importWarningWhy':
    'Se leerá y se combinará igual que en tu propia biblioteca, y desaparecerá al recargar junto con los libros inventados. Tu biblioteca no se toca en ningún caso. Para conservar lo que importes, empieza antes la tuya.',

  'landing.language': 'Idioma',
  'landing.learnMore': 'Más sobre LibrAPP',
  'landing.browserWarning':
    'A este navegador le falta algo que LibrAPP necesita. Abre El depósito cuando entres para ver los detalles.',

  // -- shell --------------------------------------------------------------
  // -- BibliotecAPPri@ ---------------------------------------------------
  'librarian.name': 'BibliotecAPPri@',
  'librarian.open': 'Lo que dice BibliotecAPPri@',
  'librarian.close': 'Guardar BibliotecAPPri@',
  'librarian.dismiss': 'Ocultar',
  'librarian.dismissWhy': 'Ocultar BibliotecAPPri@ en todas las páginas a partir de ahora',

  'librarian.empty': 'Todavía no hay nada en las estanterías. Una foto de una de ellas es la forma más rápida de empezar.',
  'librarian.welcome': 'Bienvenido de nuevo. Hay {n} {n:libro|libros} catalogado{n:|s} y esperando.',
  'librarian.unread': '{n} {n:libro|libros} de aquí {n:sigue|siguen} sin abrir.',
  'librarian.allRead': 'Todos los libros de aquí constan como leídos. No es algo que se vea a menudo.',
  'librarian.unrecorded': 'De {n} {n:libro|libros} de aquí no consta si {n:está|están} leído{n:|s}.',
  'librarian.lentLong': '{n} {n:libro|libros} {n:lleva|llevan} más de un año con otra persona.',
  'librarian.borrowedLong': '{n} {n:libro|libros} de aquí {n:es|son} de otra persona, y lo {n:es|son} desde hace más de un año.',
  'librarian.desk': 'Pregunta sobre tus propias estanterías. {n:El|Los} {n} {n:libro|libros} de aquí {n:está|están} en el catálogo.',

  'librarian.reading': '{n} {n:recorte|recortes}, lomos de arriba abajo. Esto lleva un momento.',
  'librarian.asking': 'Revisando las estanterías.',
  'librarian.imported': '{n:Ha|Han} llegado {n} {n:libro|libros}, y {known} ya {known:estaba|estaban} aquí. Una entrada para cada uno.',

  'librarian.previous': 'La anterior',
  'librarian.next': 'La siguiente',
  'librarian.position': '{at} de {of}',

  'librarian.guide.empty.1':
    'Tres formas de empezar: una foto de una estanter\u00eda, una hoja de c\u00e1lculo o extracto de tienda que ya tengas, o un cat\u00e1logo exportado desde otro dispositivo. Con cualquiera de ellas basta.',
  'librarian.guide.empty.2':
    'No se sube nada a ninguna parte. El cat\u00e1logo es un archivo de este dispositivo, y la aplicaci\u00f3n sigue funcionando sin conexi\u00f3n.',

  'librarian.guide.home.1':
    'Elige la v\u00eda que encaje con lo que ya tengas. Una foto es lo m\u00e1s r\u00e1pido; una hoja de c\u00e1lculo, lo m\u00e1s completo.',
  'librarian.guide.home.2':
    'El almacenamiento se pide solo cuando hace falta, as\u00ed que no hay nada que configurar antes de empezar.',

  'librarian.guide.catalog.1':
    'La b\u00fasqueda cubre t\u00edtulos, autor\u00eda, colecciones y etiquetas. Tres filtros quedan a la vista y el resto est\u00e1n tras "m\u00e1s filtros", que avisa cuando alguno de ellos oculta algo de la lista.',
  'librarian.guide.catalog.2':
    'El catálogo se abre como un estante. Cualquier lomo abre su ficha completa, donde el libro se puede editar, marcar como favorito o anotar, y Lista muestra esos mismos libros en filas.',

  'librarian.guide.shelf.1':
    'Fotograf\u00eda la estanter\u00eda de frente y a tama\u00f1o completo. De un lomo de pocos p\u00edxeles de alto salen los t\u00edtulos inventados.',
  'librarian.guide.shelf.2':
    'La foto se corta en recortes y cada uno se lee por separado. Ajusta cu\u00e1ntos a lo ancho y a lo alto, y descarta los que no tengan libros, antes de gastar nada.',
  'librarian.guide.shelf.3':
    'La lista de abajo pide m\u00e1s que los t\u00edtulos. El primer grupo est\u00e1 impreso en el lomo; el segundo lo recuerda el modelo, y queda marcado en cada libro que lo lleve.',

  'librarian.guide.list.1':
    'Una hoja de c\u00e1lculo, CSV, TSV, XML, o un extracto de tienda en PDF. Tenga las columnas que tenga, se usan las que se reconocen y las dem\u00e1s se dejan estar.',
  'librarian.guide.list.2':
    'Un archivo con varias listas pregunta cu\u00e1l tomar. Importar una lista de deseos como biblioteca es el error que merece una pregunta de m\u00e1s.',
  'librarian.guide.list.3':
    'El mismo libro llegando de una segunda fuente acaba siendo una entrada, no dos. Di cu\u00e1nto fiarte de cada fuente y la m\u00e1s fiable gana donde discrepen.',

  'librarian.guide.barcode.1':
    'El número bajo el código de barras nombra la edición exacta, así que no hay que adivinar ni recordar nada del libro. Enfócalo con la cámara, fotografíalo o escríbelo.',
  'librarian.guide.barcode.2':
    'Lo que vuelve se lista antes de guardar nada, y cada línea dice si ese libro se une a uno que ya tienes o añade uno nuevo.',
  'librarian.guide.barcode.3':
    'Sin clave y sin coste. Lo único que sale del dispositivo es el número, y va a Open Library.',

  'librarian.guide.backups':
    'Vaciar el catálogo hace antes una copia, y recuperar una también, así que ninguna de las dos es una puerta de un solo sentido. Una copia es el mismo archivo que escribe el botón de exportar, que es lo que permite llevarla a otro dispositivo.',
  'librarian.guide.discard':
    'Cada vía de entrada termina en una lista para revisar, y cualquier línea suelta se puede descartar antes de guardar el resto. Todo se conserva salvo lo que se aparte, y no se escribe nada hasta entonces.',
  'librarian.guide.desk.1':
    'Seis peticiones, de una en una: una sinopsis, una recomendaci\u00f3n, qu\u00e9 leer a continuaci\u00f3n, una lectura de la estanter\u00eda, una pregunta con tus palabras, y rellenar los datos que faltan en el cat\u00e1logo. Las flechas recorren la fila.',
  'librarian.guide.desk.2':
    'Todas funcionan sin clave de API, preparando la petici\u00f3n para pegarla en otro sitio. Con clave, el coste se ve antes de enviar y la cifra real despu\u00e9s.',
  'librarian.guide.desk.3':
    'Guardar esta respuesta la escribe junto al cat\u00e1logo. Las guardadas se listan al final de esta p\u00e1gina.',

  'librarian.guide.storage.1':
    'El cat\u00e1logo est\u00e1 donde lo pusiste: una carpeta elegida en este dispositivo, o el almacenamiento que gestiona el navegador. En ambos casos se queda aqu\u00ed.',
  'librarian.guide.storage.2':
    'Exportar escribe un archivo con todas las fuentes y todas las correcciones. Ese archivo es la forma de llevar el cat\u00e1logo a otro dispositivo, y vale la pena guardar una copia en otro sitio.',
  'librarian.guide.storage.3':
    'Todo lo corregido a mano aparece aqu\u00ed, y cualquiera de esas correcciones se puede deshacer.',

  'librarian.action.startPhoto': 'Empezar con una foto',
  'librarian.action.showOldest': 'Ver los más antiguos',
  'librarian.action.showLent': 'Ver lo que está fuera',
  'librarian.action.showBorrowed': 'Ver lo que hay que devolver',
  'librarian.action.showUnrecorded': 'Verlos',

  'a11y.skipToContent': 'Saltar al cat\u00e1logo',
  'app.strapline': 'tu estantería, catalogada',
  'nav.menu': 'Menú',
  'nav.menu.close': 'Cerrar',
  'nav.home': 'Inicio',
  'nav.catalog': 'Catálogo',
  'nav.shelf': 'Foto de estantería',
  'nav.list': 'Subir lista',
  'nav.barcode': 'Leer códigos',
  'nav.desk': 'BibliotecAPPri@',
  'nav.stacks': 'El depósito',
  'nav.home.hint': 'la página de bienvenida',
  'nav.catalog.hint': 'todo lo que tienes',
  'nav.shelf.hint': 'leer una fotografía',
  'nav.list.hint': 'un archivo que ya tienes',
  'nav.barcode.hint': 'el número del libro',
  'nav.desk.hint': 'preguntar por tus libros',
  'nav.stacks.hint': 'almacenamiento, copias, correcciones',

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
  'common.tellMeHow': 'Cómo se hace',
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
    'Nada que elegir ni configurar, pero los archivos no son visibles para otras aplicaciones: exportar es la forma de sacar una copia de este dispositivo.',
  'setup.browser.action': 'Usar el almacenamiento del navegador',
  'setup.noPicker':
    'Este navegador no puede seleccionar carpetas, es normal en un móvil. El almacenamiento del navegador funciona igual desde dentro de la aplicación.',
  'setUp.title': 'Lo que hay configurado',
  'setUp.storage': 'Se guarda en',
  'setUp.storage.action': 'Elegir',
  'setUp.books': 'Libros',
  'setUp.books.n': '{n}',
  'setUp.books.none': 'ninguno todavía',
  'setUp.books.action': 'Añadir',
  'setUp.key': 'Clave de IA',
  'setUp.key.stored': 'guardada',
  'setUp.key.none': 'ninguna, y es opcional',
  'setUp.key.action': 'Añadir una',
  'setup.chosen.title': 'Tu catálogo se guardará aquí',
  'setup.chosen.body': 'Todavía no se ha escrito nada.',
  'setup.chosen.next': 'Usar esta carpeta',
  'setup.chosen.change': 'Elegir otra',
  'setup.either': 'Puedes cambiarlo más adelante, y mover un catálogo de uno a otro.',

  'permit.title': 'Vuelve a abrir tu catálogo',
  'permit.body':
    'El navegador necesita que confirmes de nuevo el acceso a la carpeta. Lo pide una vez por sesión y LibrAPP no puede evitarlo.',
  'permit.open': 'Abrir la carpeta',
  'permit.elsewhere': 'Elegir otro sitio',

  // -- errors -------------------------------------------------------------
  'error.noKeyActive': 'No hay ninguna clave activada.',
  'error.notAnExport':
    '{name} no es una exportación de LibrAPP. Elige el archivo que exportaste desde El depósito → Exportar en el otro dispositivo.',
  'error.notJson': '{name} no se puede leer como JSON. Puede que se haya renombrado o descargado a medias.',

  // -- un libro -------------------------------------------------------------
  'read.read': 'leído',
  'read.unread': 'sin leer',
  'read.unknown': 'no consta',

  'book.series': 'Serie',
  'book.volume': 'vol.',
  'book.formats': 'Formatos',
  'book.read': 'Leído',
  'book.acquired': 'Adquirido',
  'book.publisher': 'Editorial',
  'book.genre': 'Género',
  'book.where': 'Dónde',
  'book.collections': 'Colecciones',
  'book.devices': 'Dispositivos',
  'book.sources': 'Fuentes',
  'book.tags': 'Etiquetas',
  'book.worthKnowing': 'Conviene saber',
  'book.confidence': 'Confianza',
  'book.confShort': 'conf. {level}',
  'book.authorUnknown': 'Autor\u00eda sin registrar',
  'book.notedWhenRead': 'Tu nota',
  'book.panelFor': 'Ficha de {title}',
  'book.callNumber': 'Signatura: las primeras letras del apellido y el año en que lo conseguiste',
  'book.favourite': 'Un favorito',
  'book.unknownNote': 'No consta si lo leíste.',
  'book.notRecorded': 'Por registrar',
  'book.record.read': 'Si está leído',
  'book.record.lent_to': 'Un préstamo',
  'book.record.notes': 'Una nota',
  'book.corrected': 'Corregido a mano.',
  'book.correctedOn': 'Corregido a mano el {date}.',
  'book.changed': 'Modificado después de leer las fuentes.',
  'book.changedOn': 'Modificado el {date}, después de leer las fuentes.',
  'book.correctedFields': '{fields}, por encima de lo que dicen las fuentes.',
  'book.wasUnset': 'sin registrar',
  'book.before': 'Antes:',
  'book.undoCorrection': 'Deshacer esta corrección',

  'flag.title_clipped': 'el título está cortado: ninguna fuente lo tenía entero',
  'flag.illegible_spine': 'el lomo no se pudo leer bien',
  'flag.no_personal_author': 'sin autor con nombre: obra de referencia, antología o texto anónimo',
  'flag.no_genre': 'todavía sin género',
  'flag.placeholder': 'un marcador de posición, no un título real: vuelve a fotografiarlo',
  'flag.placeholder_author': 'la columna de autoría trae una palabra de relleno en vez de un nombre',
  'flag.author_is_publisher': 'la columna de autoría trae el nombre de la editorial',
  'flag.impossible_year': 'publicado por primera vez en un año que aún no ha llegado',
  'flag.series_not_expanded': 'representa varios volúmenes que ninguna fuente lista por separado',
  'flag.corrected': 'corregiste esta entrada a mano',

  'confidence.high': 'alta',
  'confidence.medium': 'media',
  'confidence.low': 'baja',
  'confidence.high.why': 'de una fuente legible por máquina, contrastada con su propio recuento',
  'confidence.medium.why': 'transcrito a ojo o por un modelo',
  'confidence.low.why': 'una suposición',

  // -- subir una lista ------------------------------------------------------
  'format.physical': 'en papel',
  'format.ebook': 'ebook',
  'format.audio': 'audiolibro',

  'list.intro':
    'Una hoja de cálculo, un CSV, un catálogo en XML o una lista en PDF. Las columnas se reconocen por su nombre en varios idiomas, así que una hoja con Autor / Título / Género funciona igual que una con author / title / genre. Todo se lee en este dispositivo.',
  'list.drop': 'Suelta aquí una lista',
  'list.reading': 'Leyéndola…',
  'list.whatIsIn': '¿Qué hay en {name}?',
  'list.manyLists':
    'Este archivo contiene más de una lista. Elige la de los libros que de verdad tienes.',
  'list.whichList': 'Qué lista',
  'list.callIt': 'Llámala',
  'list.theseAre': 'Son',
  'list.trust': 'Confianza',
  'list.whatItHolds': '{n} {n:fila|filas} en esta lista',
  'list.showingSome': 'Se muestran las primeras {shown}.',
  'list.showAll': 'Mostrar las {n}',
  'list.importAction': 'Importar y reconstruir',
  'list.theseAreNote': 'es solo un valor por defecto: las filas que indican su propio formato lo conservan.',
  'list.trustNote':
    'decide quién gana cuando dos fuentes discrepan sobre el mismo libro: un extracto verificado pesa más que una lista hecha a mano.',
  'list.missingTitle': 'Esta lista no traía todo lo que LibrAPP puede aprovechar.',
  'list.missing.read':
    'Sin columna de lectura. Todos los libros de este archivo constan como no registrados, y la pila de pendientes del escritorio excluye los libros sin estado de lectura.',
  'list.missing.acquired_on':
    'Sin columna de fecha. Nada de este archivo puede ordenarse por lo que lleva esperando, que es el orden de "Comprados y nunca abiertos".',
  'list.missing.genre':
    'Sin columna de género. Estos libros no aportan nada a Géneros, en el escritorio. Rellenar huecos, en el escritorio, puede pedir géneros a un modelo.',
  'list.missing.authors':
    'Sin columna de autoría. Estos libros no se pueden agrupar por autor, y el mismo libro llegando de otra fuente es más difícil de reconocer.',
  'list.missing.series':
    'Sin columna de serie. Nada de este archivo se agrupa en saga, y se pierden los números de volumen.',
  'list.missing.publisher': 'Sin columna de editorial.',
  'list.missingHow':
    'La importación no ha ido mal. Añade la columna y trae el mismo archivo otra vez: sustituirá a este en vez de duplicarlo.',
  'list.imported': '{n} registros importados.',
  'list.nowHolds': 'El catálogo tiene ahora {n} libros.',
  'list.declared':
    'El extracto declara {declared} elementos y se leyeron {read}: una diferencia de {difference}.',

  // -- catálogo -------------------------------------------------------------
  'catalog.empty.title': 'Todavía no hay catálogo',
  'catalog.empty.body':
    'Aún no se ha incorporado nada. Empieza por una foto de una estantería o por una lista que ya tengas: cualquiera de las dos basta para construir un catálogo.',
  'catalog.empty.backups': '{n} {n:copia guardada|copias guardadas} aquí.',
  'catalog.empty.recover': 'Recuperar una',
  'catalog.empty.shelf': 'Leer una foto de la estantería',
  'catalog.empty.list': 'Subir una lista',
  'catalog.typeIn': 'Crear libro',
  'catalog.countOne': '{total} libro',
  'catalog.countAll': '{total} libros',
  'catalog.countSome': '{shown} de {total} libros',
  'catalog.builtAt': 'construido el {when}',
  'catalog.correctedCount': '{n} corregidos',
  'catalog.removedCount': '{n} retirados',
  'catalog.searchPlaceholder': 'Busca títulos, autores, series, etiquetas…',
  'catalog.search': 'Buscar',
  'catalog.searchLabel': 'Buscar en el catálogo',
  'catalog.clearSearch': 'Borrar la búsqueda',
  'catalog.groupBy': 'Agrupar por',
  'catalog.group.title': 'Título',
  'catalog.group.author': 'Autor',
  'catalog.group.series': 'Serie',
  'catalog.any': 'cualquiera',
  'catalog.format': 'Formato',
  'catalog.source': 'Fuente',
  'catalog.sort': 'Orden',
  'catalog.sort.title': 'título',
  'catalog.sort.author': 'autor',
  'catalog.sort.newest': 'más recientes primero',
  'catalog.sort.oldest': 'más antiguos primero',
  'catalog.noMatch': 'No hay coincidencias.',
  'catalog.clearFilters': 'Quitar los filtros',
  'catalog.standalone': 'Sin serie',
  'catalog.uncredited': 'Sin autoría anotada',

  // -- biblioteca -----------------------------------------------------------
  'storage.intro':
    'Dónde vive tu catálogo, con qué se construyó y cómo llevarlo a otro dispositivo.',
  'storage.owlHidden': 'BibliotecAPPri@ está oculta en todas las páginas. Al recuperarla vuelve a aparecer el distintivo en la esquina.',
  'storage.owlRestore': 'Recuperarla',
  'storage.owlBack': 'BibliotecAPPri@ ha vuelto.',
  'backups.head': 'Copias de seguridad',
  'backups.countN': '{n} {n:copia|copias}',
  'backups.intro':
    'Una copia guarda todas las fuentes y todas las correcciones, que es la biblioteca entera. Se hace una antes de vaciar el catálogo y antes de que una recuperación sustituya lo que hay, así que ninguna de las dos es una puerta de un solo sentido.',
  'backups.carry':
    'Una copia es el mismo archivo que escribe el botón de exportar. Al descargarla se puede meter en LibrAPP en otro dispositivo con Trae un catálogo.',
  'backups.makeNow': 'Hacer una copia ahora',
  'backups.reading': 'Buscando copias.',
  'backups.none': 'Aún no hay copias. Se hace una cada vez que el catálogo se vacía o se sustituye.',
  'backups.holds': '{books} {books:libro|libros} de {sources} {sources:fuente|fuentes}',
  'backups.unreadable': 'Este archivo no se puede leer. Se puede borrar, pero no recuperar.',

  'backups.reset': 'Vaciar el catálogo',
  'backups.resetConfirm': '¿Olvidar los {n} {n:libro|libros}?',
  'backups.resetWhy':
    'Se van todas las fuentes y todas las correcciones. Antes se hace una copia que queda en la lista de abajo, así que esto se deshace recuperándola. Las copias no se tocan.',
  'backups.resetDo': 'Olvidar los {n}',
  'backups.wasReset': 'El catálogo está vacío. La copia hecha antes está en la lista de abajo.',
  'backups.nothingToCopy': 'Todavía no hay nada que copiar.',
  'backups.copied': 'Copia hecha.',

  'backups.recover': 'Recuperar',
  'backups.recoverConfirm': '¿Devolver estos {books} {books:libro|libros}?',
  'backups.recoverWhy':
    'Lo que hay ahora se copia primero y queda en esta lista, así que recuperar la copia equivocada no cuesta más que elegir otra vez. Los {n} {n:libro|libros} que hay en el catálogo se sustituyen, no se mezclan.',
  'backups.recoverDo': 'Recuperar esta',
  'backups.recovered': 'Recuperada. Lo que había antes está en la lista como copia.',

  'backups.download': 'Descargar',
  'backups.downloaded': 'Guardado {name}.',
  'backups.delete': 'Borrar',
  'backups.deleteConfirm': '¿Borrar esta copia?',
  'backups.deleteWhy': 'El archivo se va para siempre. No cambia nada más, y el catálogo no se toca.',
  'backups.deleteDo': 'Borrarla',
  'backups.deleted': 'Copia borrada.',

  'backups.why.reset': 'hecha antes de vaciar',
  'backups.why.replaced': 'hecha antes de recuperar',
  'backups.why.manual': 'hecha a mano',

  'storage.eyebrow': 'Mantenimiento',
  'storage.kindUnknown': 'sin registrar',
  'storage.where': 'Almacenamiento',
  'storage.kind.folder':
    'una carpeta que elegiste, con archivos normales que puedes abrir, copiar o versionar',
  'storage.kind.browser':
    'almacenamiento del navegador, privado para LibrAPP; solo sale de aquí exportando',
  'storage.kind.demo': 'la muestra, en memoria y se va al recargar',
  'storage.kind.unknown': 'desconocido',
  'storage.using': 'Usando {used} de los {quota} que el navegador concede a esta app.',
  'storage.notPersistent': 'Este almacenamiento no está marcado como persistente.',
  'storage.notPersistentBody':
    'El navegador puede borrarlo si al dispositivo le falta espacio, y tu biblioteca se iría con él. Instalar LibrAPP suele bastar para conseguir la persistencia; mientras tanto, guarda una exportación.',
  'storage.askPersistent': 'Pedir almacenamiento persistente',
  'storage.persistent':
    'Marcado como persistente: el navegador no lo borrará para recuperar espacio.',
  'storage.elsewhere': 'Usar otra ubicación',
  'storage.forgetNote': 'Esto olvida dónde está la biblioteca; no borra nada.',

  'storage.sources': 'Fuentes',
  'storage.noSources': 'Todavía no se ha incorporado nada.',
  'storage.col.name': 'nombre',
  'storage.col.kind': 'tipo',
  'storage.col.from': 'de',
  'storage.col.trust': 'confianza',
  'storage.col.records': 'registros',
  'storage.sourcesNote':
    'Cada fuente se conserva tal como la escribió su lector. Reconstruir las combina todas, así que quitar una y reconstruir es la forma de deshacer una importación.',
  'storage.sourceRemoved': '{name} eliminada.',

  'storage.browser': 'Tu navegador',
  'storage.browserNote':
    'Se comprueba probando cada función, no leyendo el nombre del navegador: esto es lo que el tuyo puede hacer de verdad, sea cual sea.',
  'storage.allSupported': 'todo soportado',
  'storage.someMissing': '{n} función(es) no disponibles',
  'storage.notSupported': 'no soportado',
  'storage.yes': 'sí',
  'storage.no': 'no',
  'storage.missing': 'falta',
  'storage.cannotRun':
    'LibrAPP no puede funcionar bien en este navegador. Prueba con una versión actual de Chrome, Edge, Brave, Firefox o Safari.',

  'cap.secure.label': 'Página segura (HTTPS o localhost)',
  'cap.secure.needed': 'todo lo de abajo',
  'cap.secure.fix': 'Abre LibrAPP por https://, no por http://.',
  'cap.indexeddb.label': 'IndexedDB',
  'cap.indexeddb.needed': 'recordar tus ajustes y dónde está tu biblioteca',
  'cap.indexeddb.fix': 'Las ventanas privadas o de incógnito a veces lo desactivan.',
  'cap.opfs.label': 'Almacenamiento privado de archivos',
  'cap.opfs.needed': 'guardar tu biblioteca dentro del navegador',
  'cap.opfs.fix': 'Sin esto LibrAPP no tiene dónde guardar un catálogo.',
  'cap.regex.label': 'Expresiones regulares modernas',
  'cap.regex.needed': 'reconocer títulos y nombres de autor',
  'cap.regex.fix': 'Necesita Safari 16.4 o posterior, o cualquier navegador actual.',
  'cap.folder.label': 'Acceso a carpetas',
  'cap.folder.needed': 'guardar tu biblioteca en una carpeta que elijas',
  'cap.folder.fix':
    'Solo Chrome y Edge de escritorio lo ofrecen. En los demás, LibrAPP usa su propio almacenamiento, que funciona igual pero no es visible para otros programas.',
  'cap.unzip.label': 'Descompresión',
  'cap.unzip.needed': 'leer hojas .xlsx',
  'cap.unzip.fix':
    'Las importaciones de CSV, XML y PDF siguen funcionando. Necesita Firefox 113 o Safari 16.4 y posteriores.',
  'cap.canvas.label': 'Lienzo fuera de pantalla',
  'cap.canvas.needed': 'dividir una foto en recortes legibles',
  'cap.canvas.fix': 'Sin esto, importa tus libros desde una lista en vez de desde una foto.',
  'cap.bitmap.label': 'Decodificación de imágenes',
  'cap.bitmap.needed': 'abrir la foto que elijas',
  'cap.bitmap.fix': 'Sin esto, importa tus libros desde una lista en vez de desde una foto.',
  'cap.sw.label': 'Service workers',
  'cap.sw.needed': 'instalar LibrAPP y usarlo sin conexión',
  'cap.sw.fix': 'LibrAPP sigue funcionando, pero solo mientras tengas conexión.',

  'storage.corrections': 'Correcciones que has hecho',
  'storage.correctionsNote':
    'Se guardan aparte de tus fuentes y se aplican después de cada reconstrucción. Una retirada se anota aquí en vez de borrarse de la fuente, porque la siguiente reconstrucción lee las mismas fuentes y volvería a ponerlo. Cualquier corrección se puede deshacer.',
  'storage.noCorrections': 'Todavía no has corregido nada.',
  'storage.removedGroup': 'Retirados ({n})',
  'storage.editedGroup': 'Editados ({n})',
  'storage.changed': 'cambiado: {fields}',
  'storage.orphaned': '{n} corrección(es) ya no corresponden a ningún libro.',
  'storage.orphanedNote':
    'Una entrada se identifica por su autor y su título, así que esto ocurre cuando una fuente aporta un título más completo y cambia la identidad. Se listan en vez de descartarse, para que una corrección que ya no encaja con nada siga a la vista.',
  'storage.wasRemoved': 'fue retirado',
  'storage.wasEdited': 'fue editado',
  'storage.forgetIt': 'Olvidar',
  'storage.undone': 'Corrección de {what} deshecha.',
  'storage.restored': '{what} restaurado.',

  'storage.move': 'Llevar esta biblioteca a otro sitio',
  'storage.moveNote':
    'Una exportación contiene las fuentes, no el catálogo. El catálogo se reconstruye a partir de ellas en el otro dispositivo, así que ambas copias se construyen con los mismos registros.',
  'storage.exported': '{n} fuente(s) exportadas.',
  'storage.importTitle': 'Importar',
  'storage.importHint': 'elige el archivo .json que exportaste; se añade y se reconstruye',
  'storage.imported': '{n} fuente(s) importadas y catalogo reconstruido.',

  // -- foto de la estantería -------------------------------------------------
  'common.copied': 'Copiado',
  'common.save': 'Guardar',

  'shelf.intro': 'Fotografía la estantería de frente, a la resolución máxima de tu cámara.',
  'shelf.intro.how':
    'La resolución decide cuánto texto se puede leer, así que una foto más grande da una transcripción mejor. De frente mantiene los títulos rectos: una estantería fotografiada en ángulo deja el extremo lejano desenfocado y deformado.',
  'shelf.whatItIsFor': 'leer una estantería',
  'shelf.eyebrow': 'Ingresos',
  'list.listsFound': '{n} listas encontradas',
  'list.eyebrow': 'Ingresos',
  'barcode.eyebrow': 'Adquisiciones',
  'barcode.intro':
    'El número bajo un código de barras nombra la edición exacta, así que si un catálogo bibliotecario la tiene, el título, la autoría, la editorial, el año y las páginas se leen de su registro en vez de adivinarse. Sin IA y sin clave, y no se escribe nada hasta que lo hayas visto.',
  'shelf.stepOne': 'Paso uno \u00b7 La foto',
  'shelf.stepTwo': 'Paso dos \u00b7 Los recortes',
  'shelf.stepThree': 'Paso tres \u00b7 Qu\u00e9 pedir',
  'shelf.stepThree.note': 'Los t\u00edtulos vuelven siempre. Marca lo dem\u00e1s que quieras pedir.',
  'shelf.stepFour': 'Paso cuatro \u00b7 Leer los lomos',
  'shelf.stepFour.note': 'Lee los recortes con una clave, o ll\u00e9valos t\u00fa a una sesi\u00f3n de IA.',
  'shelf.stepFour.how':
    'Con una clave guardada, LibrAPP env\u00eda los recortes al servicio que hayas elegido y trae aqu\u00ed la respuesta. Sin clave no sale nada: copia el prompt, guarda los recortes y pega ambos en la sesi\u00f3n de IA que ya uses. La lectura es la misma en los dos casos, y en los dos ves los libros antes de guardar ninguno.',
  'shelf.stepFive': 'Paso cinco \u00b7 Trae una transcripci\u00f3n',
  'shelf.checkWhatItRead': 'Comprueba lo que ha le\u00eddo',
  'shelf.step1': '1 · La foto',
  'shelf.dropPhoto': 'Elige una foto',
  'shelf.takePhoto': 'Haz una foto',
  'shelf.dropPhotoHint': 'JPEG o PNG · no se sube nada',
  'shelf.photoReplace': 'Elige otra foto',
  'shelf.cutting': 'Recortando las fotos…',
  'shelf.step2': '2 · Leer los lomos',
  'shelf.tileCount': '{n} foto(s)',
  'shelf.piecesNote':
    'Pásale estos recortes a una IA junto con el prompt de abajo y pídele que escriba la transcripción.',
  'shelf.piecesNote.how':
    'La foto se recorta porque una estantería entera en una sola imagen queda demasiado pequeña para leerse. Cada recorte conserva la resolución del original, y se solapan, así que un libro que cae en una junta aparece entero en alguno.',
  'shelf.grid': 'Cuadrícula · {cols} × {rows}',
  'shelf.lessAcross': 'Quitar columna',
  'shelf.moreAcross': 'A\u00f1adir columna',
  'shelf.lessDown': 'Quitar fila',
  'shelf.moreDown': 'A\u00f1adir fila',
  'shelf.gridNote': 'Trata de tener unos pocos lomos enteros en cada recorte.',
  'shelf.gridNote.how':
    'Una estanter\u00eda ancha necesita varias columnas; un primer plano de tres libros necesita un solo recorte. Las filas son las que parten un t\u00edtulo por la mitad, as\u00ed que a\u00f1ade una solo cuando la foto muestre de verdad baldas una encima de otra.',
  'shelf.backToSuggested': 'volver a la sugerida de {cols}×{rows}',
  'shelf.reading': 'leyendo los lomos…',
  'shelf.needsKey': 'Guarda una clave en el recuadro de servicio de IA, arriba, para leerlos aqu\u00ed.',
  'shelf.readForMe': 'Lee estas fotos por mí',
  'shelf.tokensOnly': 'unos {k}k tokens de entrada, a tu tarifa',
  'shelf.youApprove': 'apruebas el resultado antes de que se importe nada',
  'shelf.copyInstructions': 'Copiar el prompt',
  'shelf.hideThem': 'Ocultar el prompt',
  'shelf.readThem': 'Leer el prompt',
  'shelf.saveAll': 'Guardar todas las fotos',
  'shelf.tileAlt': 'Foto fila {row}, columna {column}',
  'shelf.step3': '3 · Comprueba lo que ha leído',
  'shelf.bookCount': '{n} libro(s)',
  'shelf.cost': 'coste {amount}',
  'shelf.readyBelow': '{n} {n:libro|libros} leídos. La lista está abajo, lista para revisar.',
  'shelf.checkNote':
    'Todavía no se ha importado nada. Revisa la lista ahora: un lomo mal leído ya no se puede detectar una vez está en el catálogo. Lo marcado como dudoso es lo que conviene contrastar con las fotos de arriba.',
  'shelf.unplaced': 'sin ubicar',
  'shelf.importThese': 'Importar estos {n} libros',
  'shelf.discard': 'Descartar la lectura entera',
  'shelf.stepBring': '{n} · Trae tú la transcripción',
  'shelf.bringNote.optional': '(opcional, y no hace falta clave)',
  'shelf.bringNote':
    'Lee los recortes en cualquier sesión de IA con el prompt de arriba y suelta aquí el JSON.',
  'shelf.bringNote.how':
    'Esta es la vía que no necesita clave: la lectura ocurre donde ya tengas una sesión de IA, y LibrAPP solo recoge el resultado. Un archivo con un libro sin título o con un valor de confianza desconocido se rechaza aquí, no se importa.',
  'shelf.dropTranscription': 'Suelta aquí la transcripción',
  'shelf.dropTranscriptionHint': 'el archivo JSON que escribió el modelo',
  'shelf.result': '{n} libros leídos de la foto.',
  'shelf.uncertain': '{n} lomo(s) dudosos',
  'shelf.resultNote':
    'Una foto no puede ver la fecha de compra ni si lo has leído, así que eso queda sin saber hasta que lo diga otra fuente.',

  // -- el escritorio --------------------------------------------------------
  'desk.nothingYet': 'Aún no hay con qué trabajar: construye primero un catálogo.',
  'desk.intro': 'BibliotecAPPri@ te echa una mano.',
  'desk.neverOpened': 'Comprados y nunca abiertos',
  'desk.waitingAtLeast': 'esperando al menos',
  'desk.year': '{n} año',
  'desk.years': '{n} años',
  'desk.yearsShort': '{n} años',
  'desk.neverOpenedNote':
    'Solo aparecen los libros de los que consta que no has leído. {unknown} libros no tienen ninguna constancia de lectura.',
  'desk.nothingWaited': 'Nada lleva esperando tanto tiempo.',
  'desk.showFive': 'Ver solo los cinco primeros',
  'desk.showAll': 'Ver los {n}',
  'desk.madeOf': 'G\u00e9neros',
  'desk.madeOfNote': 'Haz clic para ver los libros.',

  'desk.eyebrow': 'Consultas',
  'desk.askEyebrow': 'Plantea una pregunta',
  'desk.ask': 'Preguntar',
  'desk.next': 'Qué leer ahora',
  'desk.next.placeholder': 'Un vuelo largo, una semana libre, algo corto, algo que no sea novela.',
  'desk.next.blurb':
    'Elige entre los libros que ya tienes y dice cómo será leerlo. Nada que no tengas.',
  'desk.portrait': 'Leer la estantería',
  'desk.portrait.placeholder': 'Opcional. Pide un enfoque concreto, o déjalo vacío.',
  'desk.portrait.blurb':
    'Describe la colección a quien la ha reunido: qué es, sobre qué vuelve, dónde se contradice, de qué anda escasa.',
  'desk.quick': 'Pregunta rápida',
  'desk.quick.placeholder': 'Lo que quieras. Tus palabras van tal cual al modelo, con tu catálogo adjunto.',
  'desk.quick.blurb':
    'Tu propia pregunta, con tu catálogo como contexto. No se compone nada por ti salvo una nota de que la respuesta va en texto plano.',
  'desk.fill': 'Rellenar huecos',
  'desk.fill.blurb':
    'Pide los datos que el cat\u00e1logo no tiene. Cada respuesta viene de la memoria del modelo, no de una lectura, as\u00ed que no se guarda nada sin verlo antes.',
  'desk.fill.all': 'Todo',
  'desk.fill.thatIsALot':
    'Eso pide todos los campos de todos los libros a los que les falte alguno, que es la petici\u00f3n m\u00e1s grande posible. Menos campos, o menos libros, cuestan menos.',
  'fill.field.genre': 'G\u00e9nero',
  'fill.field.series': 'Colecci\u00f3n, y qu\u00e9 volumen',
  'fill.field.series_index': 'Número de volumen',
  'fill.field.publisher': 'Editorial',
  'fill.field.published_year': 'A\u00f1o de primera publicaci\u00f3n',
  'fill.field.pages': 'P\u00e1ginas de una edici\u00f3n tipo',
  'fill.field.rating': 'Una valoraci\u00f3n general de lectores',
  'fill.field.original_language': 'Idioma original',
  'fill.field.abstract': 'Un resumen breve',
  'desk.fill.which': 'Qu\u00e9 pedir',
  'desk.fill.missing': 'faltan {n}',
  'desk.fill.pickOne': 'Elige al menos un campo.',
  'desk.fill.covers': 'Esto pregunta por {n} {n:libro|libros}. El coste sube con esa cifra.',
  'desk.fill.working': 'Preguntando por {n} {n:libro|libros}. La respuesta llega como una lista que revisar, no como texto.',
  'desk.fill.forBooks': 'para {n} {n:libro|libros}',
  'desk.fill.onBooks': 'en {n} {n:libro|libros}',
  'desk.fill.written': 'Guardado. {n} {n:libro|libros} actualizados.',
  'desk.fill.review': 'Lo que ha llegado',
  'desk.fill.reviewNote':
    '{n} {n:libro|libros} por actualizar. Se {ignored:ha|han} descartado {ignored} por no servir o por constar ya.',
  'desk.fill.accept': 'Guardar {n}',
  'desk.fill.discard': 'Descartar',
  'desk.fill.paste': 'Pegar una respuesta',
  'desk.fill.pastePrompt': 'Pega aqu\u00ed la respuesta JSON.',
  'desk.whatItIsFor': 'el escritorio',
  'desk.synopsis': 'Sinopsis',
  'desk.synopsis.placeholder': '¿Qué libro? No hace falta que sea tuyo.',
  'desk.synopsis.blurb':
    'Describe un libro con tu catálogo como contexto: qué sostiene, a qué responde y cómo se relaciona con los libros que ya tienes.',
  'desk.recommend': 'Recomendación',
  'desk.recommend.placeholder':
    '¿Algo que la oriente? «algo para un vuelo largo», o déjalo en blanco.',
  'desk.recommend.blurb':
    'Dos o tres libros, elegidos según la dirección que ha tomado tu lectura reciente. Antes de proponer una compra se revisa lo que ya tienes sin leer.',
  'desk.askService': 'Preguntar a {service}',
  'desk.askForMe': 'Pregunta por mí',
  'desk.thinking': 'pensando…',
  'desk.copyRequest': 'Copiar la petición entera',
  'desk.copyProfile': 'Copiar solo el perfil',
  'desk.copyAnswer': 'Copiar la respuesta',
  'desk.answer': 'Respuesta',
  'desk.streaming': 'llegando…',
  'desk.withKey':
    'Con una clave, LibrAPP pregunta en tu nombre. Sin ella, monta la petición para que la pegues en cualquier sesión de IA: las mismas instrucciones, el mismo perfil, la misma pregunta.',
  'desk.withoutKey':
    'LibrAPP reúne las instrucciones, tu perfil de lectura y tu pregunta en un solo bloque, listo para pegar en cualquier sesión de IA. Añade abajo una clave para enviarlo desde aquí.',
  'desk.promptsNote':
    'Las instrucciones se guardan como texto plano, así que puedes cambiar cómo pregunta.',
  'desk.profile': 'Tu perfil de lectura',
  'desk.characters': '{n} caracteres',
  'desk.profileNote':
    'No es el catálogo entero. Cientos de títulos ocuparían casi toda la petición, así que esto es un resumen de la colección y de cómo ha cambiado, con una muestra de libros concretos.',

  // -- escribir un libro, corregir otro -------------------------------------
  'isbn.title': 'Busca un libro por su código de barras',
  'isbn.note':
    'El número que hay bajo el código de barras identifica la edición exacta. Si Open Library tiene esa edición, el título, la autoría, la editorial, el año y las páginas se toman de su registro.',
  'isbn.settleFirst': 'Guarda o cancela los libros de abajo antes de leer más.',
  'isbn.privacy':
    'Este paso pregunta a Open Library, un catálogo libre del Internet Archive, en openlibrary.org. De este dispositivo sale una lista de ISBN y nada más: ni títulos, ni notas, ni ningún otro dato del catálogo. Lo que vuelve se enseña aquí antes de escribir nada.',
  'isbn.paste': 'Códigos, uno por línea o separados por comas',
  'isbn.format': 'Son',
  'isbn.format.physical': 'libros en papel',
  'isbn.format.ebook': 'libros electrónicos',
  'isbn.format.audio': 'audiolibros',
  'isbn.fromPhoto': 'Leer un código de una foto',
  'isbn.reading': 'Leyendo la foto',
  'isbn.scanned': '{n} {n:código leído|códigos leídos} de {photos} {photos:foto|fotos}.',
  'isbn.scannedNone': 'No se ha encontrado ningún código en {photos} {photos:foto|fotos}. De frente y de cerca, con el código entero en el encuadre, es como mejor se lee.',
  'isbn.carriedReader':
    'Este navegador no trae lector de códigos, así que LibrAPP usa el suyo. Se descarga la primera vez que escaneas algo, y se sirve desde aquí y no desde ningún otro sitio.',
  'scan.start': 'Escanear con la cámara',
  'scan.stop': 'Parar la cámara',
  'scan.viewfinder': 'Lo que enfoca la cámara',
  'scan.starting': 'Pidiendo la cámara',
  'scan.hint':
    'Pon el código dentro del recuadro. Los códigos se añaden según se leen, y el mismo libro dos veces cuenta una. La imagen no sale de este dispositivo y no se graba.',
  'scan.found': '{n} {n:código leído|códigos leídos}.',
  'scan.none': 'Todavía no se ha leído nada.',
  'scan.denied':
    'Se ha denegado la cámara. Permítela para esta página en el navegador, o escribe los números.',
  'scan.noCamera': 'No hay cámara que el navegador pueda usar. Puedes escribir los códigos o leerlos de un archivo.',
  'scan.inUse': 'La cámara la está usando otra cosa. Ciérrala y vuelve a intentarlo.',
  'scan.failed': 'No se ha podido iniciar la cámara.',
  'isbn.fromFile': 'Leerlos de un archivo',
  'isbn.ready': '{n} {n:código|códigos} {n:listo|listos}.',
  'isbn.noneFound': 'Todavía no hay códigos ahí.',
  'isbn.rejected': '{n} rechazados, porque el dígito de control no cuadra:',
  'isbn.lookUp': 'Buscar {n} {n:libro|libros}',
  'isbn.lookingUp': 'Buscando',
  'isbn.looking': 'Buscando {done} de {total}',
  'isbn.foundN': '{n} {n:libro encontrado|libros encontrados}.',
  'isbn.missingN': '{n} que el servicio no conoce.',
  'isbn.checkThese':
    'Revísalos antes de guardarlos. Cuando Open Library no tiene un ISBN, responde con otro libro en vez de con un error, así que un número equivocado produce un registro verosímil pero incorrecto.',
  'isbn.joins': 'se une a un libro que tienes',
  'isbn.joinsWhich': 'Se fusiona con {title}, que ya está en tu estantería',
  'isbn.isNew': 'libro nuevo',
  'isbn.mergeNote':
    'Un libro que ya está en tu estantería toma estos datos en vez de convertirse en una segunda entrada. Cuál es cuál está marcado en cada uno.',
  'isbn.missingWhich': 'No ha vuelto nada de:',
  'isbn.noAuthor': 'sin autoría anotada',
  'isbn.pages': '{n} páginas',
  'isbn.keep': 'Guardar {n}',
  'isbn.kept': '{n} {n:libro guardado|libros guardados}.',
  'isbn.nowHolds': 'El catálogo tiene ya {n}.',
  'isbn.merged':
    'Un libro que ya estaba en tu estantería toma los datos nuevos en vez de convertirse en una segunda entrada. Lo que no estaba se añade.',

  'editor.add': 'Añadir un libro',
  'editor.correct': 'Corregir esta entrada',
  'editor.addNote':
    'Esto pasa a ser un registro de tu fuente manual y se combina como cualquier otro. Si el libro que escribes ya está en el catálogo por otra vía, obtienes una sola entrada que conoce las dos.',
  'editor.correctNote':
    'Esto se anota como una corrección, aparte de tus fuentes y aplicada después de cada reconstrucción. Pesa más que lo que digan las fuentes y se puede deshacer.',
  'editor.title': 'Título',
  'editor.authors': 'Autores',
  'editor.authorsHint': 'separa varios con comas; déjalo en blanco si la obra es anónima',
  'editor.volume': 'Volumen',
  'editor.readHint': 'en blanco significa que nadie lo anotó',
  'editor.where': 'Dónde está',
  'editor.whereHint': 'un estante, una habitación, una caja',
  'editor.notes': 'Notas',
  'editor.notesHint': 'Comentarios personales sobre este libro. La BibliotecAPPri@ los tiene en cuenta.',
  'editor.favourite': 'Favorito',
  'editor.favouriteOn': 'Marcado como favorito',
  'editor.favouriteOff': 'Sin marcar',
  'editor.saveCorrection': 'Guardar la corrección',
  'editor.addBook': 'Añadir el libro',
  'editor.correctable':
    'Campos corregibles: {fields}. Todo lo demás se deduce de las fuentes.',
  'editor.needTitle': 'El título es lo único sin lo que un libro no puede entrar.',
  'editor.badDate': 'Escribe la fecha como AAAA-MM-DD, o déjala en blanco.',
  'editor.badVolume': 'El número de volumen tiene que ser un número entero.',
  'editor.badPages': 'El número de páginas tiene que ser un número entero.',
  'editor.pagesHint': 'Una edición tipo, no un recuento de este ejemplar',
  'editor.nothingChanged': 'No ha cambiado nada, así que no hay nada que corregir.',

  // -- el quesito de géneros ------------------------------------------------
  'pie.noGenres': 'Todavía no hay géneros anotados.',
  'pie.noGenresHow':
    'Una foto solo lo registra si la lista de extras lo pidió, y una hoja de cálculo solo si tenía esa columna. Rellenar huecos, aquí arriba, puede pedir el resto.',
  'pie.other': 'otros',
  'pie.showMore': 'Nombrar más géneros',
  'pie.showFewer': 'Volver a los principales',
  'pie.more': '{n} más',
  'pie.note':
    'Los {named} géneros mayores cubren el {share}% de los libros con etiqueta. Las otras {rest} etiquetas son, cada una, demasiado pequeñas para el gráfico',
  'pie.fragmented':
    'las etiquetas de género vienen de tus fuentes y no son una lista cerrada, así que se dispersan',

  // -- la caja de la clave --------------------------------------------------
  'key.title': 'Servicio de IA',
  'key.inUse': 'clave guardada · en uso',
  'key.switchedOff': 'clave guardada · desactivada',
  'key.absent': 'sin clave guardada',
  'key.stored': 'clave guardada',
  'key.service': 'Servicio',
  'key.model': 'Modelo',
  'key.modelPlaceholder': 'el nombre del modelo que use tu servicio',
  'key.address': 'Dirección',
  'key.addressNote':
    'Cualquier cosa que hable la interfaz de chat de OpenAI: Groq, Mistral, DeepSeek, Together o un servidor en tu propia máquina. Da la dirección que termina en /v1. Un servidor local tiene que estar configurado para aceptar peticiones de esta página antes de que un navegador pueda hablar con él.',
  'key.thisFeature': 'esto',
  'key.optional':
    'Opcional. Sin clave, {what} sigue funcionando: LibrAPP te lo prepara todo para que lo pegues tú en una sesión de IA. Con clave, puede hacerlo aquí mismo.',
  'key.whereToGet': 'Dónde conseguir una clave',
  'key.fieldLabel': 'Clave de API para {service}',
  'key.save': 'Guardar la clave',
  'key.pasteFirst': 'Pega antes una clave.',
  'key.wrongShape':
    'Eso no parece una clave de {service}, cuyas claves suelen parecerse a {hint}. Si estás seguro de que es correcta, pulsa otra vez para guardarla: un servicio puede cambiar la forma de sus claves en cualquier momento.',
  'key.privacy':
    'Se guarda en el almacenamiento de este navegador, en este dispositivo; se envía solo a {where} y nunca se escribe en tu catálogo ni en una exportación. Cualquier cosa que se ejecute en esta página podría leerla, así que usa una clave limitada a su propio proyecto o espacio, con un límite de gasto.',
  'key.activeNote':
    'está en uso. LibrAPP puede enviar peticiones a {where} para leer lomos y responder preguntas.',
  'key.offNote':
    'está guardada, pero LibrAPP no la usará. La vía de copiar y pegar sigue funcionando.',
  'key.switchOn': 'Activar',
  'key.switchOff': 'Desactivar',
  'key.delete': 'Borrar',
  'key.storedNote':
    'Desactivarla la conserva para más adelante sin dejar que la app gaste nada. Borrarla la quita de este dispositivo. Cada servicio guarda su propia clave, así que cambiar de uno a otro no cuesta nada.',

  // -- el pie de página y lo que hay detrás ----------------------------------
  'foot.about': 'Acerca de',
  'foot.privacy': 'Privacidad',
  'foot.licence': 'Licencia',
  'foot.source': 'Código fuente',
  'foot.report': 'Informar de un problema',

  'about.title': 'Todo tu catálogo y tu bibliotecario personal, a mano.',
  'about.back': 'Volver',

  'about.what': 'Qué es LibrAPP',
  'about.whatBody':
    'Dos mitades. Un catálogo de libros que construyes con lo que ya tienes: una foto de una estantería, una hoja de cálculo tuya, el extracto de una tienda, o las tres cosas a la vez. El mismo libro que llega por varias vías acaba siendo una entrada y no tres.',
  'about.whatBody2':
    'Y un bibliotecario que se ha leído tus estanterías. El escritorio responde sobre lo que tienes: qué leer a continuación y por qué, qué te falta de un autor que has ido reuniendo a medias, qué hilos recorren la colección, una lista para un vuelo largo. No es una red social, ni un registro de lecturas, ni una tienda. Nadie más puede ver tus estanterías, y no hay nadie que pudiera verlas, porque LibrAPP no tiene servidor. Dos pasos pueden usar un servicio de IA si le das una clave, y los dos funcionan también sin ella.',

  'about.librarian': 'La BibliotecAPPri@',
  'about.librarianBody':
    'El escritorio responde a tres tipos de petici\u00f3n. Una sinopsis de cualquier libro, est\u00e9 en el cat\u00e1logo o no, contada a alguien de quien ya se conocen las estanter\u00edas. Una recomendaci\u00f3n de dos o tres libros, medida por hacia d\u00f3nde va la lectura y no por d\u00f3nde ha estado. Y rellenar huecos: pedir los datos que faltan en el cat\u00e1logo, para libros que ya est\u00e1n en la estanter\u00eda, que es la \u00fanica que escribe algo. Nada de lo que propone se guarda sin ense\u00f1arlo antes, y todo lo que escribe se puede deshacer libro a libro.',
  'about.librarianOwl':
    'El distintivo de la esquina es la misma bibliotecaria, con hasta tres cosas que decir sobre la p\u00e1gina en la que est\u00e1s, de una en una. Primero lo que merece una acci\u00f3n: qu\u00e9 hay que devolver, qu\u00e9 lleva m\u00e1s tiempo sin abrir, de qu\u00e9 no consta si est\u00e1 le\u00eddo. Al seguir una l\u00ednea, el cat\u00e1logo se filtra por ella. Despu\u00e9s viene c\u00f3mo funciona la p\u00e1gina, que es lo que hace falta la primera vez. No hay d\u00f3nde escribir, y es a prop\u00f3sito: una pregunta que merezca la pena va en el escritorio, donde recibe el cat\u00e1logo como contexto y el coste se ve antes de gastarlo. Se puede despedir para siempre desde su propio globo, y recuperar desde El depósito.',
  'about.librarianYours':
    'Marcar un libro como favorito y escribir una nota sobre \u00e9l son las dos cosas de una ficha que no vienen de nadie m\u00e1s. Ambas se env\u00edan con cada pregunta, citadas como tuyas y no como descripci\u00f3n del libro, y el escritorio tiene instrucciones de darles m\u00e1s peso que a nada que haya deducido contando.',
  'about.librarianHonest':
    'Cada frase del distintivo sale de contar el cat\u00e1logo, no de suponer. De una estanter\u00eda sin constancia de lectura se dice eso, no se felicita por haberla terminado.',
  'about.who': 'Quién la escribió',
  'about.whoBody':
    'LibrAPP la escribe Jesús J. Ballesteros, y nació como una forma de catalogar sus propias estanterías.',
  'about.cv': 'Su web y su CV',
  'about.github': 'Su GitHub',
  'about.repo': 'Este proyecto en GitHub',
  'about.noWarranty':
    'Esto es un proyecto personal que se ofrece de manera gratuita. No lleva garantía ni promesa de soporte, y puede cambiar o dejar de actualizarse. Guarda una exportación de todo lo que te importaría perder.',

  'about.privacy': 'Privacidad',
  'about.privacyBody':
    'Breve, porque hay poco que contar. LibrAPP es una página que se ejecuta entera en tu navegador, y esto es todo:',
  'about.privacy.account':
    'Sin cuenta, sin registro, sin perfil. No hay dónde iniciar sesión.',
  'about.privacy.device':
    'Tu catálogo se escribe en este dispositivo: una carpeta que elijas o el almacenamiento que el navegador guarda para esta app. Nunca se sube a ninguna parte.',
  'about.privacy.key':
    'Si das una clave de IA, se queda en este navegador y solo se envía al servicio que hayas elegido. Nunca se escribe en tu catálogo ni se incluye en una exportación. Las fotos se recortan en este mismo dispositivo; solo salen los recortes, y solo cuando tú lo pides.',
  'about.privacy.cookies':
    'Sin cookies, sin analítica y sin rastreadores. Lo único que se recuerda de ti es qué idioma elegiste y dónde está tu biblioteca.',
  'about.privacy.requests':
    'Tres cosas pueden salir de este dispositivo, todas opcionales y ninguna activada de antemano. Leer la foto de una estantería envía los recortes de esa foto. Preguntar en el escritorio envía tu perfil de lectura, que el escritorio muestra entero antes. Buscar un libro por su código de barras envía ese número a Open Library y nada más: ni título, ni notas, nada de tu estantería. Los códigos se leen aquí, vengan de una foto o de la cámara, y ni la foto ni lo que ve la cámara salen ni se graban.',
  'about.privacy.offline':
    'Una vez cargada funciona sin ninguna conexión, que es la prueba más sencilla de que no se está enviando nada a ninguna parte.',
  'about.privacyCheck': 'No hace falta que te fies de nada de esto: el código es público.',
  'about.readSource': 'Léelo',

  'about.licence': 'Licencia',
  'about.licenceBody':
    'LibrAPP se puede usar, leer, modificar y compartir libremente para cualquier fin que no sea comercial. Venderla, o montar sobre ella un servicio de pago, requiere permiso previo. Los términos completos:',
  'about.licenceName': 'PolyForm Noncommercial 1.0.0',
  'about.attributions': 'Construida con',
  'about.attributionsBody':
    'Esto es trabajo de otras personas, incluido en la app y usado según sus propios términos:',

  'about.contact': 'Cómo contactar',
  'about.contactBody':
    'No hay formulario de contacto, porque no hay servidor que lo reciba. Todo lo que tenga que ver con la app, sea un fallo, algo confuso o una idea, va en GitHub, donde queda público y no se pierde. Lo demás puede ir por los datos de contacto de mi propia web.',
  'about.reportProblem': 'Informar de un problema',
  'about.contactMe': 'Contactar conmigo',

  'about.version': 'Versión {build}',
  'about.updateNote':
    'El depósito puede forzar una copia nueva si esto parece anticuado',

  // -- versión, en El depósito ------------------------------------
  'version.title': 'Versión',
  'version.built': 'Compilada el {when}.',
  'version.body':
    'LibrAPP guarda una copia de sí misma en este dispositivo para poder abrirse sin conexión. Esa copia suele reemplazarse sola en la siguiente visita. Si parece atascada en una versión antigua, tírala y trae la actual.',
  'version.refresh': 'Traer una copia nueva',
  'version.safe':
    'Esto descarta solo la app. Tu biblioteca, tus fuentes y tus correcciones no se guardan aquí y no se tocan.',

  // -- cómo se ha hecho -----------------------------------------------------
  'foot.ai': 'Uso de IA',

  'about.ai': 'La IA, y cómo se construyó esto',
  'about.aiBody':
    'LibrAPP la ha escrito una persona trabajando con un asistente de IA, a lo largo de varias sesiones. La mayor parte del código lo tecleó el modelo. Todas las decisiones sobre qué construir fueron de la persona.',
  'about.ai.author': 'Jesús J. Ballesteros',
  'about.ai.author.did':
    'concibió la app y decidió cada paso: qué construir a continuación, cuál de los caminos propuestos tomar, qué dejar fuera y cuándo parar. Puso todo aquello con lo que se probó: sus propias estanterías, sus propios extractos, sus propios dispositivos. Revisó los resultados y los corrigió.',
  'about.ai.assistant': 'Claude, un asistente de IA',
  'about.ai.assistant.did':
    'propuso enfoques cuando se le pedía y alguna vez sin que se le pidiera, escribió el código y la documentación, y llevó a cabo los cambios que él decidía.',
  'about.ai.testers': 'Unos primeros probadores',
  'about.ai.testers.did':
    'la usaron y dijeron qué no funcionaba. Más de una cosa de aquí existe por eso.',
  'about.aiReview':
    'La revisión no fue un trámite. El asistente se equivocó: una vez dio por reparado un título cortado que seguía cortado, y eligió una forma de partir las fotos que se deshacía con un primer plano de tres libros. Las dos cosas las detectó alguien contrastando el resultado con la estantería real. Esa experiencia es la razón de que esta app te enseñe lo que ha leído un modelo y espere a que lo apruebes, en vez de importarlo sin decir nada.',
  'about.aiNotYourBooks':
    'Todo eso va de cómo se escribió el programa. No tiene nada que ver con el contenido de tu catálogo: no se inventa ninguna entrada, cada libro viene de una fuente que tú has dado, y las funciones de IA dentro de la app son opcionales, están apagadas hasta que añades una clave, y siempre te enseñan el resultado antes de guardar nada.',

  'key.saveAnyway': 'Guardarla de todos modos',

  'list.savedAs': 'Guardado como {name}.',

  'keep.discard': 'Descartar',
  'keep.restore': 'Recuperar',
  'keep.discardedTag': 'descartado',
  'keep.someDropped': '{n} descartados. Se importarán {kept}.',
  'keep.noneLeft': 'Está todo descartado. No queda nada que importar.',
  'keep.note': 'Todo esto se importa salvo lo que se descarte.',
  'shelf.dropTile': 'Descartar',
  'shelf.keepTile': 'Recuperar',
  'shelf.droppedTag': 'descartada',
  'shelf.discardHint':
    'Descarta cualquier foto que no tenga ningún lomo legible: una pared, una lámpara, el borde de una alfombra. Las fotos descartadas no se envían ni se pagan.',
  'shelf.tileCountKept': '{kept} de {total} fotos',
  'shelf.noneKept':
    'Están descartadas todas las fotos, así que no hay nada que leer. Deja al menos una.',
  'shelf.batchProgress': 'Tanda {at} de {of}',
  'shelf.someTilesFailed':
    'Algunos recortes no se han podido leer y faltan en lo que sigue: {tiles}. {why}',
  'shelf.stop': 'Detener',
  'shelf.stopped': 'Detenido antes de que llegara una respuesta.',
  'shelf.timedOut':
    'Sin respuesta despu\u00e9s de {minutes} minutos, as\u00ed que se ha abandonado la petici\u00f3n. El servicio puede estar saturado o no ser accesible desde esta p\u00e1gina.',
  'shelf.failed': 'La lectura ha fallado.',
  'shelf.failedUnknown': 'Ha fallado sin decir por qu\u00e9.',
  'shelf.copyFailure': 'Copiar este mensaje',
  'shelf.usingService': 'Servicio: {service} \u00b7 modelo: {model}',

  'phone.title': 'Instálalo en tu dispositivo',
  'phone.body':
    'Añade LibrAPP a la pantalla de inicio. Desde ahí se abre a pantalla completa y funciona sin conexión.',
  'phone.install': 'Instalar LibrAPP',
  'phone.already': 'Instalada.',
  'phone.byHand':
    'iPhone: Compartir y luego Añadir a pantalla de inicio. Android: el menú del navegador y luego Instalar aplicación.',
  'phone.catalog': 'Cada dispositivo guarda su propio catálogo. Para llevarlo a otro:',
  'phone.catalogAction': 'expórtalo y tráelo',
  'desk.estimateNote': 'una estimaci\u00f3n. Lo que ha costado de verdad aparece con la respuesta.',

  // -- prestados y tomados prestados ----------------------------------------
  'book.lentTo': 'Prestado a',
  'book.borrowedFrom': 'Tomado prestado de',

  'editor.whereIsIt': 'Fuera de la estanter\u00eda',
  'editor.loanHint':
    'Solo se aplica uno de los dos a la vez. Un libro que prestas sigue siendo tuyo; uno que te prestan, no.',
  'editor.lentTo': 'Prestado a',
  'editor.lentOn': 'Prestado el',
  'editor.borrowedFrom': 'Tomado prestado de',
  'editor.borrowedOn': 'Tomado prestado el',
  'editor.bothLoans': 'Un libro no puede estar prestado y tomado prestado a la vez.',

  'catalog.whereIs': 'D\u00f3nde',
  'catalog.mark': 'Marcar como favorito',
  'catalog.unmark': 'Quitar la marca de favorito',
  'catalog.favourites': 'Favoritos',
  'catalog.favouritesOnly': 'S\u00f3lo favoritos',
  'catalog.atHome': 'en la estanter\u00eda',
  'catalog.lentOut': 'prestado',
  'catalog.borrowed': 'de otra persona',

  'desk.away': 'Prestados y tomados prestados',
  'ring.previous': 'Anterior: {name}',
  'ring.next': 'Siguiente: {name}',
  'desk.shelves': 'Estantes que el escritorio destaca',
  'desk.nothingHere': 'Aqu\u00ed no hay nada.',
  'desk.keepAnswer': 'Guardar esta respuesta',
  'desk.kept': 'Respuestas que guardaste',
  'desk.kept.done': 'Guardada',
  'desk.seeThem': 'Verlos',
  'desk.hideThem': 'Ocultarlos',
  'desk.favourites': 'Tus favoritos',
  'desk.favouritesNote': 'Libros se\u00f1alados a mano. Pesan m\u00e1s que cualquier cosa que el cat\u00e1logo deduzca por su cuenta.',
  'desk.showFavourites': 'Verlos todos en el cat\u00e1logo',
  'desk.awayNote':
    'Libros que no est\u00e1n donde deber\u00edan. Se anotan a mano, uno a uno, porque no hay otra forma de saberlo.',
  'desk.lentGroup': 'Prestados ({n})',
  'desk.borrowedGroup': 'Prestados a ti y todav\u00eda aqu\u00ed ({n})',
  'desk.nothingAway': 'No hay ning\u00fan libro fuera de casa.',
  'desk.withWhom': 'con {who}',
  'desk.fromWhom': 'de {who}',
  'desk.sinceUnknown': 'sin fecha anotada',

  // -- la nube de palabras --------------------------------------------------
  'desk.themes': 'Palabras clave',
  'desk.themesNote': 'Usadas m\u00e1s de dos veces. Haz clic para ver los libros.',
  'cloud.keyword.none': 'Todav\u00eda no hay ninguna palabra clave usada por m\u00e1s de dos libros.',
  'cloud.keyword.noneHow':
    'Las palabras clave vienen de tus fuentes. Una foto solo las registra si la lista de extras las pidió, y una hoja de cálculo solo si tenía esa columna.',
  'cloud.genre.none': 'Todavía ningún género lo usa más de un libro.',
  'cloud.genre.noneHow':
    'Los géneros vienen de tus fuentes. Rellenar huecos, aquí arriba, puede pedir a un modelo los que falten.',
  'cloud.count': 'la usan {n} libros',
  'cloud.label': '{word}, la usan {n} libros',
  'cloud.keyword.note': 'Se muestran {drawn} de {distinct} palabras clave. Las dem\u00e1s aparecen una o dos veces.',
  'cloud.genre.note': 'Se muestran {drawn} de {distinct} g\u00e9neros. Las dem\u00e1s aparecen una sola vez.',
  'catalog.taggedWith': 'etiquetado {tag}',

  // -- extras que se le pueden pedir al modelo ------------------------------
  'book.abstract': 'Resumen:',
  'book.published': 'Publicado por primera vez',
  'book.pages': 'Páginas, edición tipo',
  'book.rating': 'Valoraci\u00f3n',
  'book.originalLanguage': 'Idioma original',
  'flag.recalled_details':
    'algunos datos de aqu\u00ed los ha recordado un modelo, no se han le\u00eddo de la foto',

  'shelf.extras': 'Pedir algo m\u00e1s que los t\u00edtulos',
  'shelf.extrasNote':
    'Cada opci\u00f3n a\u00f1ade algo a lo que se le pide al modelo, por las dos v\u00edas, y a lo que cuesta la petici\u00f3n.',
  'shelf.extras.read': 'Le\u00eddo de la foto',
  'shelf.extras.recalled': 'Recordado por el modelo',
  'shelf.extras.recalledWarning':
    'Esto no est\u00e1 en tu foto. El modelo lo produce a partir de lo que ha aprendido, as\u00ed que puede equivocarse sobre un libro real. Todo lo que se rellene as\u00ed queda marcado en el libro y cuenta como menos fiable.',
  'shelf.extra.publisher': 'Editorial o sello',
  'shelf.extra.edition': 'Edici\u00f3n o impresi\u00f3n',
  'shelf.extra.language': 'Idioma de la cubierta',
  'shelf.extra.series': 'Serie y n\u00famero de volumen',
  'shelf.extra.duplicates': 'Unir un libro que sale en dos fotos',
  'shelf.extra.abstract': 'Un resumen breve',
  'shelf.extra.published': 'A\u00f1o de la primera publicaci\u00f3n',
  'shelf.extra.rating': 'Una valoraci\u00f3n general de lectores',
  'shelf.extra.original': 'Idioma original y si esto es una traducci\u00f3n',
  'shelf.extra.genre': 'Un género para cada libro que reconozca',
  'shelf.extra.pages': 'El n\u00famero de p\u00e1ginas de una edici\u00f3n tipo',
  'shelf.noCover':
    'No se ofrecen im\u00e1genes de cubierta. Un modelo solo puede devolver un enlace, y descargarlo dir\u00eda a quien aloje la imagen qu\u00e9 libros tienes.',
  'shelf.recalledCount': '{n} libro(s) traen alg\u00fan dato recordado',

  'editor.noPersonalAuthor':
    'Sin autor con nombre. Las fuentes lo describen como \u00ab{label}\u00bb, que es una descripci\u00f3n y no una persona, as\u00ed que no aparece arriba.',
  'editor.noAuthorRecorded':
    'Sin autor anotado. D\u00e9jalo en blanco si la obra es an\u00f3nima o corporativa, o escribe uno.',

  'nav.about': 'Acerca de',
  'nav.about.hint': 'qu\u00e9 es esto y en qu\u00e9 t\u00e9rminos',
  'sidebar.holdings': 'Lo que hay',
  'about.eyebrow': 'Colof\u00f3n',
  'theme.label': 'Tema',
  'theme.light': 'D\u00eda',
  'theme.dark': 'Noche',
  'theme.following': 'Pulsa otra vez para seguir al sistema',

  'catalog.eyebrow': 'Lista de la estanter\u00eda',
  'catalog.moreFilters': 'm\u00e1s filtros',
  'catalog.fewerFilters': 'menos filtros',
  'catalog.hiddenFiltersOn': 'Tambi\u00e9n filtrando por {filters}, que est\u00e1 oculto.',
  'catalog.showThem': 'Mostrar esos filtros',
  'catalog.clearTag': 'Quitar',
  'catalog.viewMode': 'C\u00f3mo mostrar los libros',
  'catalog.mode.list': 'Lista',
  'catalog.mode.spines': 'Lomos',
  'catalog.bulk.markAll': 'Marcar los {n} que se ven como',
  'catalog.bulk.as.read': 'leídos',
  'catalog.bulk.as.unread': 'sin leer',
  'catalog.bulk.as.unknown': 'sin registrar',
  'catalog.bulk.confirm': '¿Marcar {n} libros como {state}?',
  'catalog.bulk.confirmWhy':
    'Todos los libros que dejan a la vista los filtros, no solo los que caben en pantalla. Es una corrección como cualquier otra: se puede deshacer libro a libro, o de golpe desde El depósito.',
  'catalog.bulk.doIt': 'Marcar los {n}',
  'catalog.spineWall': 'Los libros como lomos en un estante',
  'catalog.spinesCaption':
    'El grosor sale del n\u00famero de p\u00e1ginas cuando consta; un libro sin \u00e9l se dibuja con el ancho intermedio en vez de adivinarlo. La altura sale de la longitud del t\u00edtulo y el color es fijo para cada libro, as\u00ed que ambos son decorativos.',
  'catalog.spinesEmpty': 'Ning\u00fan libro de aqu\u00ed tiene lomo que dibujar.',
}
