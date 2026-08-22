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
    '{name} no es una exportación de LibrAPP. Elige el archivo que exportaste desde Biblioteca → Exportar en el otro dispositivo.',
  'error.notJson': '{name} no se puede leer como JSON. Puede que se haya renombrado o descargado a medias.',

  // -- un libro -------------------------------------------------------------
  'read.read': 'leído',
  'read.unread': 'sin leer',
  'read.unknown': 'sin constancia',

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
  'book.notedWhenRead': 'Anotado al leerlo:',
  'book.unknownNote':
    'Nadie ha dejado constancia de si lo leíste. Eso no es lo mismo que no haberlo leído, así que se deja en blanco en vez de suponerlo.',
  'book.corrected': 'Corregido a mano.',
  'book.correctedOn': 'Corregido a mano el {date}.',
  'book.correctedFields': '{fields} — por encima de lo que dicen las fuentes.',
  'book.before': 'Antes:',
  'book.undoCorrection': 'Deshacer esta corrección',

  'flag.title_clipped': 'el título está cortado: ninguna fuente lo tenía entero',
  'flag.illegible_spine': 'el lomo no se pudo leer bien',
  'flag.no_personal_author': 'sin autor con nombre: obra de referencia, antología o texto anónimo',
  'flag.no_genre': 'todavía sin género',
  'flag.placeholder': 'un marcador de posición, no un título real: vuelve a fotografiarlo',
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
    'Una hoja de cálculo, un CSV, un catálogo en XML o un extracto de tienda en PDF. Las columnas se reconocen por su nombre en varios idiomas, así que una hoja con Autor / Título / Género funciona igual que una con author / title / genre. Todo se lee en este dispositivo.',
  'list.drop': 'Suelta aquí una lista',
  'list.reading': 'Leyéndola…',
  'list.whatIsIn': '¿Qué hay en {name}?',
  'list.manyLists':
    'Este archivo contiene más de una lista. Elige la de los libros que de verdad tienes: importar una lista de deseos como si fuera tu biblioteca es el error que merece una pregunta más.',
  'list.whichList': 'Qué lista',
  'list.callIt': 'Llámala',
  'list.theseAre': 'Son',
  'list.trust': 'Confianza',
  'list.importAction': 'Importar y reconstruir',
  'list.theseAreNote': 'es solo un valor por defecto: las filas que indican su propio formato lo conservan.',
  'list.trustNote':
    'decide quién gana cuando dos fuentes discrepan sobre el mismo libro: un extracto verificado pesa más que una lista hecha a mano.',
  'list.imported': '{n} registros importados.',
  'list.nowHolds': 'El catálogo tiene ahora {n} libros.',
  'list.declared':
    'El extracto declara {declared} elementos y se leyeron {read}: una diferencia de {difference}.',

  // -- catálogo -------------------------------------------------------------
  'catalog.empty.title': 'Todavía no hay catálogo',
  'catalog.empty.body':
    'Aún no se ha incorporado nada. Empieza por una foto de una estantería o por una lista que ya tengas: cualquiera de las dos, por sí sola, basta para construir un catálogo.',
  'catalog.empty.shelf': 'Leer una foto de la estantería',
  'catalog.empty.list': 'Subir una lista',
  'catalog.typeIn': 'Escribir un libro',
  'catalog.countOne': '{total} libro',
  'catalog.countAll': '{total} libros',
  'catalog.countSome': '{shown} de {total} libros',
  'catalog.builtAt': 'construido el {when}',
  'catalog.correctedCount': '{n} corregidos',
  'catalog.removedCount': '{n} retirados',
  'catalog.searchPlaceholder': 'Busca títulos, autores, series, etiquetas…',
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
  'catalog.noMatch': 'No hay nada que coincida.',
  'catalog.clearFilters': 'Quitar los filtros',
  'catalog.standalone': 'Sueltos',

  // -- biblioteca -----------------------------------------------------------
  'storage.intro':
    'Dónde vive tu catálogo, con qué se construyó y cómo llevarlo a otro dispositivo.',
  'storage.where': 'Almacenamiento',
  'storage.kind.folder':
    'una carpeta que elegiste — archivos normales que puedes abrir, copiar o versionar',
  'storage.kind.browser':
    'almacenamiento del navegador — privado para LibrAPP; solo sale de aquí exportando',
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
  'cap.canvas.needed': 'cortar una foto en piezas legibles',
  'cap.canvas.fix': 'Sin esto, importa tus libros desde una lista en vez de desde una foto.',
  'cap.bitmap.label': 'Decodificación de imágenes',
  'cap.bitmap.needed': 'abrir la foto que elijas',
  'cap.bitmap.fix': 'Sin esto, importa tus libros desde una lista en vez de desde una foto.',
  'cap.sw.label': 'Service workers',
  'cap.sw.needed': 'instalar LibrAPP y usarlo sin conexión',
  'cap.sw.fix': 'LibrAPP sigue funcionando, pero solo mientras tengas conexión.',

  'storage.corrections': 'Correcciones que has hecho',
  'storage.correctionsNote':
    'Se guardan aparte de tus fuentes y se aplican después de cada reconstrucción. Quitar un libro no puede borrarlo — la siguiente reconstrucción lee las mismas fuentes y volvería a ponerlo — así que la retirada se anota aquí y se puede deshacer.',
  'storage.noCorrections': 'Todavía no has corregido nada.',
  'storage.removedGroup': 'Retirados ({n})',
  'storage.editedGroup': 'Editados ({n})',
  'storage.changed': 'cambiado: {fields}',
  'storage.orphaned': '{n} corrección(es) ya no corresponden a ningún libro.',
  'storage.orphanedNote':
    'Una entrada se identifica por su autor y su título, así que esto ocurre cuando una fuente mejor aporta un título más completo y cambia la identidad. Se listan en vez de descartarse, porque el silencio parecería decir que la corrección ha dejado de importar.',
  'storage.wasRemoved': 'fue retirado',
  'storage.wasEdited': 'fue editado',
  'storage.forgetIt': 'Olvidarla',
  'storage.undone': 'Corrección de {what} deshecha.',
  'storage.restored': '{what} restaurado.',

  'storage.move': 'Llevar esta biblioteca a otro sitio',
  'storage.moveNote':
    'Una exportación contiene las fuentes, no el catálogo. El catálogo se reconstruye a partir de ellas al otro lado, de modo que las dos copias no pueden acabar discrepando sobre cuál es la buena.',
  'storage.exported': '{n} fuente(s) exportadas.',
  'storage.importTitle': 'Importar una exportación',
  'storage.importHint': 'elige el archivo .json que exportaste; se añade y se reconstruye',
  'storage.imported': '{n} fuente(s) importadas y catalogo reconstruido.',

  // -- foto de la estantería -------------------------------------------------
  'common.copied': 'Copiado',
  'common.save': 'Guardar',

  'shelf.intro':
    'Fotografía la estantería de frente y a la resolución máxima de tu cámara. Esto importa más que ninguna otra cosa: una librería entera a un megapíxel es ilegible, y esa misma estantería a cincuenta no lo es.',
  'shelf.whatItIsFor': 'leer una estantería',
  'shelf.step1': '1 · La foto',
  'shelf.dropPhoto': 'Haz o elige una foto',
  'shelf.dropPhotoHint': 'JPEG o PNG · no se sube nada',
  'shelf.cutting': 'Cortándola en piezas…',
  'shelf.step2': '2 · Leer los lomos',
  'shelf.tileCount': '{n} pieza(s)',
  'shelf.tilesNote':
    'Las piezas se cortan a resolución nativa y se solapan, de modo que un libro que cae en una junta aparece entero en alguna de ellas. Pasáselas a un modelo junto con las instrucciones de abajo y pidele que escriba la transcripción.',
  'shelf.grid': 'Rejilla · {cols} de ancho × {rows} de alto',
  'shelf.lessAcross': '− ancho',
  'shelf.moreAcross': '+ ancho',
  'shelf.lessDown': '− alto',
  'shelf.moreDown': '+ alto',
  'shelf.gridNote':
    'Busca piezas con unos pocos lomos enteros y el título legible de arriba abajo. Ningún ajuste vale para todas las estanterías: una librería ancha pide varias piezas a lo ancho, y un primer plano de tres libros pide una y nada más.',
  'shelf.gridWarning': 'Añadir filas es lo que parte un título por la mitad',
  'shelf.gridWarningTail':
    ', así que añádelas solo cuando la foto muestre de verdad baldas una encima de otra.',
  'shelf.backToSuggested': 'volver a la sugerida de {cols}×{rows}',
  'shelf.reading': 'leyendo los lomos…',
  'shelf.readForMe': 'Lee estas piezas por mí',
  'shelf.tokensOnly': 'unos {k}k tokens de entrada, a tu tarifa',
  'shelf.youApprove': 'apruebas el resultado antes de que se importe nada',
  'shelf.copyInstructions': 'Copiar las instrucciones',
  'shelf.hideThem': 'Ocultarlas',
  'shelf.readThem': 'Leerlas',
  'shelf.saveAll': 'Guardar todas las piezas',
  'shelf.tileAlt': 'Pieza fila {row}, columna {column}',
  'shelf.step3': '3 · Comprueba lo que ha leído',
  'shelf.bookCount': '{n} libro(s)',
  'shelf.cost': 'coste {amount}',
  'shelf.checkNote':
    'Todavía no se ha importado nada. Un modelo leyendo un lomo puede equivocarse de una forma que el catálogo ya no podrá detectar después, así que este es el momento de mirar. Lo marcado como dudoso merece un contraste con las piezas de arriba.',
  'shelf.unplaced': 'sin ubicar',
  'shelf.importThese': 'Importar estos {n} libros',
  'shelf.discard': 'Descartar',
  'shelf.stepBring': '{n} · Trae tú la transcripción',
  'shelf.bringNote':
    'La vía que no necesita clave: lee las piezas en cualquier sesión de IA con las instrucciones de arriba y suelta aquí el JSON. La importación rechaza un archivo con un libro sin título o con un valor de confianza desconocido: una mala lectura debe pararse aquí y no aparecer luego en tu catálogo.',
  'shelf.dropTranscription': 'Suelta aquí la transcripción',
  'shelf.dropTranscriptionHint': 'el archivo JSON que escribió el modelo',
  'shelf.result': '{n} libros leídos de la foto.',
  'shelf.uncertain': '{n} lomo(s) dudosos',
  'shelf.resultNote':
    'Una foto no puede ver la fecha de compra ni si lo has leído, así que eso queda sin saber hasta que lo diga otra fuente.',

  // -- el escritorio --------------------------------------------------------
  'desk.nothingYet': 'Aún no hay con qué trabajar: construye primero un catálogo.',
  'desk.intro':
    'Donde el catálogo deja de ser una lista y empieza a ser un argumento. Todo lo de la izquierda se calcula aquí mismo. La derecha prepara una pregunta para un modelo: tu estantería es lo que hace que la respuesta sea tuya y no genérica.',
  'desk.neverOpened': 'Comprados y nunca abiertos',
  'desk.waitingAtLeast': 'esperando al menos',
  'desk.year': '{n} año',
  'desk.years': '{n} años',
  'desk.yearsShort': '{n} años',
  'desk.neverOpenedNote':
    'Ordenados por lo que llevan esperando, ponderado por las ganas que tenías de ellos entonces. Solo aparecen los libros de los que consta que no has leído: {unknown} libros no tienen ninguna constancia de lectura, y suponerla enterraría esta lista bajo libros que ya terminaste.',
  'desk.nothingWaited': 'Nada lleva esperando tanto tiempo.',
  'desk.showFive': 'Ver solo los cinco primeros',
  'desk.showAll': 'Ver los {n}',
  'desk.madeOf': 'De qué se compone la colección',

  'desk.ask': 'Preguntar',
  'desk.whatItIsFor': 'el escritorio',
  'desk.synopsis': 'Sinopsis',
  'desk.synopsis.placeholder': '¿Qué libro? No hace falta que sea tuyo.',
  'desk.synopsis.blurb':
    'Describe un libro a alguien que tiene tu estantería delante: qué sostiene, contra qué reacciona y cómo se sitúa frente a los libros que ya tienes.',
  'desk.recommend': 'Recomendación',
  'desk.recommend.placeholder':
    '¿Algo que la oriente? «algo para un vuelo largo», o déjalo en blanco.',
  'desk.recommend.blurb':
    'Dos o tres libros, nunca más, elegidos por dónde va tu lectura y no por dónde ha estado; y antes de proponerte una compra mira lo que tienes sin leer.',
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
    'LibrAPP reúne las instrucciones, tu perfil de lectura y tu pregunta en un solo bloque: pégalo en la sesión de IA que ya uses. Añade abajo una clave y podrá preguntar por ti.',
  'desk.promptsNote':
    'Las instrucciones se guardan como texto plano, así que puedes cambiar cómo pregunta.',
  'desk.profile': 'Tu perfil de lectura',
  'desk.characters': '{n} caracteres',
  'desk.profileNote':
    'A propósito no es el catálogo entero: unos cientos de títulos ahogan la pregunta. Esto es la forma de la colección y cómo se ha movido, con suficientes libros con nombre como para argumentar.',

  // -- escribir un libro, corregir otro -------------------------------------
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
  'editor.whereHint': 'una balda, una habitación, una caja en el trastero',
  'editor.notes': 'Notas',
  'editor.saveCorrection': 'Guardar la corrección',
  'editor.addBook': 'Añadir el libro',
  'editor.correctable':
    'Campos corregibles: {fields}. Todo lo demás se deduce de las fuentes.',
  'editor.needTitle': 'El título es lo único sin lo que un libro no puede entrar.',
  'editor.badDate': 'Escribe la fecha como AAAA-MM-DD, o déjala en blanco.',
  'editor.badVolume': 'El número de volumen tiene que ser un número entero.',
  'editor.nothingChanged': 'No ha cambiado nada, así que no hay nada que corregir.',

  // -- el quesito de géneros ------------------------------------------------
  'pie.noGenres': 'Todavía no hay géneros anotados.',
  'pie.other': 'otros',
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
    '— LibrAPP puede enviar peticiones a {where} para leer lomos y responder preguntas.',
  'key.offNote':
    '— guardada, pero LibrAPP no la usará. La vía de copiar y pegar sigue funcionando.',
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

  'about.title': 'Sobre esta app y sobre quién la escribió.',
  'about.back': 'Volver',

  'about.what': 'Qué es LibrAPP',
  'about.whatBody':
    'Un catálogo de libros que construyes con lo que ya tienes: una foto de una estantería, una hoja de cálculo tuya, el extracto de una tienda, o las tres cosas a la vez. El mismo libro que llega por varias vías acaba siendo una entrada y no tres.',
  'about.whatBody2':
    'No es una red social, ni un registro de lecturas, ni una tienda. Nadie más puede ver tus estanterías, y no hay nadie que pudiera verlas: LibrAPP no tiene servidor. Dos pasos pueden usar un servicio de IA si le das una clave — leer los lomos de una foto y responder preguntas sobre tu colección — y los dos funcionan también sin ella.',

  'about.who': 'Quién la escribió',
  'about.whoBody':
    'LibrAPP la escribe Jesús J. Ballesteros, y nació como una forma de catalogar sus propias estanterías. Se te está pidiendo que fotografíes tus libros y, si quieres las funciones con IA, que pegues una clave en esta página; parece justo decir claramente de quién es este trabajo y dónde comprobarlo.',
  'about.cv': 'Su web y su CV',
  'about.github': 'Su GitHub',
  'about.repo': 'Este proyecto en GitHub',
  'about.noWarranty':
    'Esto es un proyecto personal que se regala. No lleva garantía ni promesa de soporte, y puede cambiar o dejar de actualizarse. Guarda una exportación de todo lo que te importaría perder.',

  'about.privacy': 'Privacidad',
  'about.privacyBody':
    'Breve, porque hay poco que contar. LibrAPP es una página que se ejecuta entera en tu navegador, y esto es todo:',
  'about.privacy.account':
    'Sin cuenta, sin registro, sin perfil. No hay dónde iniciar sesión.',
  'about.privacy.device':
    'Tu catálogo se escribe en este dispositivo: una carpeta que elijas o el almacenamiento que el navegador guarda para esta app. Nunca se sube a ninguna parte.',
  'about.privacy.key':
    'Si das una clave de IA, se queda en este navegador y solo se envía al servicio que hayas elegido. Nunca se escribe en tu catálogo ni se incluye en una exportación. Las fotos se cortan en piezas aquí mismo; solo salen las piezas, y solo cuando tú lo pides.',
  'about.privacy.cookies':
    'Sin cookies, sin analítica, sin rastreadores, sin peticiones a terceros. Lo único que se recuerda de ti es qué idioma elegiste y dónde está tu biblioteca.',
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
    'No hay formulario de contacto, porque no hay servidor que lo reciba. Todo lo que tenga que ver con la app — un fallo, algo confuso, una idea — va en GitHub, donde queda público y no se pierde. Lo demás puede ir por los datos de contacto de mi propia web.',
  'about.reportProblem': 'Informar de un problema',
  'about.contactMe': 'Contactar conmigo',

  'about.version': 'Versión {build}',
  'about.updateNote':
    'la pestaña Biblioteca puede forzar una copia nueva si esto parece anticuado',

  // -- versión, en la pestaña Biblioteca ------------------------------------
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
    'LibrAPP la ha escrito una persona trabajando con un asistente de IA, a lo largo de varias sesiones. La mayor parte del código lo tecleó el modelo. Todas las decisiones sobre qué construir fueron de la persona. Parece mejor decir qué es cada cosa que dejarlo a la imaginación:',
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
}
