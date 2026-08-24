# Revisión de la traducción al español

LibrAPP tiene **413 textos**. Abajo están todos, en inglés y en español,
agrupados por la parte de la aplicación donde aparecen.

**Cómo usar este archivo.** Escribe tu versión en la línea `→`. Si el español actual
te parece bien, borra la línea `→` o déjala vacía: solo aplicaré los cambios que
escribas.

**Dos reglas que conviene fijar antes de empezar**, porque afectan a todo:

1. **Tratamiento.** Ahora mismo todo tutea. Alternativa: usted, o impersonal.
2. **Variedad.** El objetivo es un español que se lea igual de natural en Madrid
   y en Bogotá, así que conviene evitar lo muy peninsular ("balda", "trastero",
   "ordenador") y lo muy americano ("computadora", "celular").

`{algo}` entre llaves es un hueco que rellena el programa: no lo traduzcas, y
no cambies su nombre. Puedes moverlo dentro de la frase.

---

## Empieza por aquí: 14 entradas que ya me parecen mal

- `nav.desk` — Palabra inventada ("LibrAPPrio"); el juego de palabras inglés no sobrevive.
- `read.unknown` — "sin constancia" suena jurídico. ¿"sin datos" / "no consta"?
- `book.read` — Etiqueta de campo: ¿"Leído" o "¿Leído?"?
- `list.callIt` — "Llámala" concuerda con "la lista"; comprobar que el contexto lo justifica.
- `catalog.countOne` — Comprobar singular/plural con catalog.countAll.
- `catalog.countAll` — Comprobar singular/plural con catalog.countOne.
- `catalog.standalone` — "Sueltos" es ambiguo. ¿"Sin serie"?
- `storage.forgetIt` — "Olvidarla" concuerda con "la corrección"; comprobar.
- `shelf.tilesNote` — ERROR: "Pasáselas" → "Pásaselas" (o "Dáselas"); "pidele" → "pídele".
- `desk.year` — Comprobar la concordancia de singular/plural con desk.years.
- `desk.years` — Comprobar la concordancia de singular/plural con desk.year.
- `desk.yearsShort` — ERROR: da "1 años" para un año, y usa punto decimal donde el español usa coma.
- `editor.whereHint` — "balda" y "trastero" son muy de España. Alternativa neutra: "un estante, una habitación, una caja guardada".
- `pie.other` — Aparece como etiqueta de un sector del gráfico: ¿"otros" u "otras"?

---

## Página de inicio (24)

#### `landing.tagline`

- **EN** Create your full book catalog from a picture of your shelf.
- **ES** Crea el catálogo completo de tus libros a partir de una foto de tu estantería.
- **→** Cataloga todos tus libros con sólo una foto de tu estantería.

#### `landing.intro`

- **EN** Photograph a shelf and LibrAPP reads the spines into a catalog you can search, filter and browse. You can also bring in a spreadsheet, a store export, or a catalog you built on another device — and combine them all without duplicates.
- **ES** Fotografía una estantería y LibrAPP lee los lomos para crear un catálogo que puedes buscar, filtrar y consultar. También puedes traer una hoja de cálculo, la exportación de una tienda o un catálogo que hicieras en otro dispositivo, y combinarlo todo sin duplicados.
- **→** Fotografía una estantería y LibrAPP leera los lomos para crear un catálogo que puedes consultar y editar. También puedes subir una tabla, una lista en PDF o un catálogo desde dispositivo, y combinarlo todo sin duplicados.

#### `landing.privacy.title`

- **EN** Your books stay with you
- **ES** Tus libros se quedan contigo
- **→**

#### `landing.privacy.body`

- **EN** There is no account and no server. Your catalog is written to this device and nothing is uploaded. LibrAPP works with no connection at all once it has loaded.
- **ES** No hay cuenta ni servidor. Tu catálogo se guarda en este dispositivo y no se sube nada. Una vez cargada, LibrAPP funciona sin conexión.
- **→**

#### `landing.needs.title`

- **EN** What it needs to work
- **ES** Qué hace falta para que funcione
- **→**

#### `landing.needs.storage`

- **EN** Somewhere to keep your catalog — a folder you pick, or storage the browser manages for you. You choose, and you can change your mind later.
- **ES** Un lugar donde guardar tu catálogo: una carpeta que elijas o el almacenamiento que gestiona el navegador. Tú decides, y puedes cambiar de idea más adelante.
- **→**

#### `landing.needs.source`

- **EN** At least one source of books: a photograph, a list you already keep, or a catalog exported from another device.
- **ES** Al menos una fuente de libros: una fotografía, una lista o un catálogo exportado desde otro dispositivo.
- **→**

#### `landing.needs.ai`

- **EN** Reading spines from a photograph needs an AI assistant. You can paste the tiles into any assistant yourself, or give LibrAPP a key so it can do it. Everything else works without AI.
- **ES** Leer los lomos de una fotografía necesita un asistente de IA. Puedes pegar las imágenes en el asistente que uses, o darle a LibrAPP una clave para que lo haga por ti. Todo lo demás funciona sin IA.
- **→**

#### `landing.start`

- **EN** Where would you like to start?
- **ES** ¿Por dónde quieres empezar?
- **→**

#### `landing.start.hint`

- **EN** Any of these will set up your storage if you have not chosen it yet.
- **ES** Cualquiera de estas opciones configurará el almacenamiento si aún no lo has elegido.
- **→**

#### `landing.option.storage`

- **EN** I want to choose where my catalog is kept
- **ES** Quiero elegir dónde se guarda mi catálogo
- **→**

#### `landing.option.storage.hint`

- **EN** Set this up first, before adding any books.
- **ES** Configúralo primero, antes de añadir libros.
- **→**

#### `landing.option.photo`

- **EN** I have a picture of my shelf
- **ES** Tengo una foto de mi estantería
- **→**

#### `landing.option.photo.hint`

- **EN** The quickest way to catalog books you own on paper.
- **ES** La forma más rápida de catalogar los libros que tienes en papel.
- **→**

#### `landing.option.list`

- **EN** I have a list of the books I own
- **ES** Tengo una lista de los libros que tengo
- **→** Ya tengo una lista de mis libros

#### `landing.option.list.hint`

- **EN** A spreadsheet, a CSV, an XML file, or a store export as PDF.
- **ES** Una hoja de cálculo, un CSV, un XML o la exportación de una tienda en PDF.
- **→** Una hoja de cálculo, un CSV, un XML o una lista en PDF.

#### `landing.option.import`

- **EN** I have a catalog from another device
- **ES** Tengo un catálogo de otro dispositivo
- **→**

#### `landing.option.import.hint`

- **EN** Bring in a file you exported from LibrAPP elsewhere.
- **ES** Trae el archivo que exportaste desde LibrAPP en otro sitio.
- **→**

#### `landing.option.browse`

- **EN** I want to see my catalog
- **ES** Quiero ver mi catálogo
- **→**

#### `landing.option.browse.hint`

- **EN** Go straight to the books you already have here.
- **ES** Ir directamente a los libros que ya tienes aquí.
- **→** Ir directamente al catálogo.

#### `landing.option.browse.empty`

- **EN** There is nothing here yet — start with one of the options above.
- **ES** Aquí todavía no hay nada: empieza por una de las opciones de arriba.
- **→**

#### `landing.language`

- **EN** Language
- **ES** Idioma
- **→**

#### `landing.learnMore`

- **EN** More about LibrAPP
- **ES** Más sobre LibrAPP
- **→**

#### `landing.browserWarning`

- **EN** This browser is missing something LibrAPP needs. Open the Library tab once you are in for the details.
- **ES** A este navegador le falta algo que LibrAPP necesita. Abre la pestaña Biblioteca cuando entres para ver los detalles.
- **→**

---

## Navegación (12)

#### `nav.home`

- **EN** Start
- **ES** Inicio
- **→**

#### `nav.catalog`

- **EN** Catalog
- **ES** Catálogo
- **→**

#### `nav.shelf`

- **EN** Shelf picture
- **ES** Foto de estantería
- **→**

#### `nav.list`

- **EN** Upload list
- **ES** Subir lista
- **→**

#### `nav.desk` ⚠️

> Palabra inventada ("LibrAPPrio"); el juego de palabras inglés no sobrevive.

- **EN** LibrAPPrian's desk
- **ES** La mesa del LibrAPPrio
- **→** BibliotecAPPri@ 

#### `nav.library`

- **EN** Library
- **ES** Biblioteca
- **→**

#### `nav.home.hint`

- **EN** the welcome page
- **ES** la página de bienvenida
- **→**

#### `nav.catalog.hint`

- **EN** everything you own
- **ES** todo lo que tienes
- **→**

#### `nav.shelf.hint`

- **EN** read a photograph
- **ES** leer una fotografía
- **→**

#### `nav.list.hint`

- **EN** a file you already keep
- **ES** un archivo que ya tienes
- **→**

#### `nav.desk.hint`

- **EN** ask about it
- **ES** preguntar sobre ello
- **→**

#### `nav.library.hint`

- **EN** where it lives
- **ES** dónde se guarda
- **→**

---

## Barra lateral (8)

#### `sidebar.books`

- **EN** books
- **ES** libros
- **→**

#### `sidebar.authors`

- **EN** authors
- **ES** autores
- **→**

#### `sidebar.read`

- **EN** read
- **ES** leídos
- **→**

#### `sidebar.unread`

- **EN** unread
- **ES** sin leer
- **→**

#### `sidebar.notRecorded`

- **EN** not recorded
- **ES** no consta
- **→**

#### `sidebar.noCatalog`

- **EN** No catalog yet.
- **ES** Todavía no hay catálogo.
- **→**

#### `sidebar.rebuild`

- **EN** Rebuild catalog
- **ES** Reconstruir catálogo
- **→**

#### `sidebar.working`

- **EN** working…
- **ES** trabajando…
- **→**

---

## Palabras comunes (14)

#### `common.cancel`

- **EN** Cancel
- **ES** Cancelar
- **→**

#### `common.close`

- **EN** Close
- **ES** Cerrar
- **→**

#### `common.dismiss`

- **EN** Dismiss
- **ES** Descartar
- **→**

#### `common.edit`

- **EN** Edit
- **ES** Editar
- **→**

#### `common.remove`

- **EN** Remove
- **ES** Quitar
- **→**

#### `common.restore`

- **EN** Restore
- **ES** Restaurar
- **→**

#### `common.undo`

- **EN** Undo
- **ES** Deshacer
- **→**

#### `common.import`

- **EN** Import
- **ES** Importar
- **→**

#### `common.export`

- **EN** Export
- **ES** Exportar
- **→**

#### `common.opening`

- **EN** Opening your library…
- **ES** Abriendo tu catálogo…
- **→**

#### `common.saving`

- **EN** saving…
- **ES** guardando…
- **→**

#### `common.importing`

- **EN** importing…
- **ES** importando…
- **→**

#### `common.copied`

- **EN** Copied
- **ES** Copiado
- **→**

#### `common.save`

- **EN** Save
- **ES** Guardar
- **→**

---

## Elegir almacenamiento (10)

#### `setup.title`

- **EN** Where should your catalog be kept?
- **ES** ¿Dónde quieres guardar tu catálogo?
- **→**

#### `setup.intro`

- **EN** LibrAPP keeps your catalog on this device and sends it nowhere. It only needs to know where to put it.
- **ES** LibrAPP guarda tu catálogo en este dispositivo y no lo envía a ninguna parte. Solo necesita saber dónde ponerlo.
- **→**

#### `setup.folder.title`

- **EN** A folder you choose
- **ES** Una carpeta que elijas
- **→**

#### `setup.folder.body`

- **EN** Plain files you can open, back up, or keep anywhere you like. LibrAPP writes your sources and catalog there and nothing else.
- **ES** Archivos normales que puedes abrir, copiar o guardar donde quieras. LibrAPP escribe ahí tus fuentes y tu catálogo, y nada más.
- **→**

#### `setup.folder.action`

- **EN** Choose a folder
- **ES** Elegir una carpeta
- **→**

#### `setup.browser.title`

- **EN** Storage the browser manages
- **ES** Almacenamiento del navegador
- **→**

#### `setup.browser.body`

- **EN** Nothing to choose and nothing to configure, but the files are not visible to other apps — an export is how a copy leaves this device.
- **ES** Nada que elegir ni configurar, pero los archivos no son visibles para otras aplicaciones: una exportación es la forma de sacar una copia de este dispositivo.
- **→** Nada que elegir ni configurar, pero los archivos no son visibles para otras aplicaciones: exportar es la forma de sacar una copia de este dispositivo.

#### `setup.browser.action`

- **EN** Use browser storage
- **ES** Usar el almacenamiento del navegador
- **→**

#### `setup.noPicker`

- **EN** This browser has no folder picker — on a phone that is normal. Browser storage below works the same from inside the app.
- **ES** Este navegador no tiene selector de carpetas, lo cual es normal en un móvil. El almacenamiento del navegador funciona igual desde dentro de la aplicación.
- **→** Este navegador puede seleccionar carpetas, es normal en un móvil. El almacenamiento del navegador funciona igual desde dentro de la aplicación.

#### `setup.either`

- **EN** Either can be changed later, and a catalog can be moved from one to the other.
- **ES** Puedes cambiarlo más adelante, y mover un catálogo de uno a otro.
- **→**

---

## Permisos (4)

#### `permit.title`

- **EN** Reopen your catalog
- **ES** Vuelve a abrir tu catálogo
- **→**

#### `permit.body`

- **EN** The browser needs you to confirm access to the folder again. It asks once per session, and there is nothing LibrAPP can do to skip it.
- **ES** El navegador necesita que confirmes de nuevo el acceso a la carpeta. Lo pide una vez por sesión y LibrAPP no puede evitarlo.
- **→**

#### `permit.open`

- **EN** Open the folder
- **ES** Abrir la carpeta
- **→**

#### `permit.elsewhere`

- **EN** Choose somewhere else
- **ES** Elegir otro sitio
- **→**

---

## Errores (3)

#### `error.noKeyActive`

- **EN** No key is switched on.
- **ES** No hay ninguna clave activada.
- **→**

#### `error.notAnExport`

- **EN** {name} is not a LibrAPP export. Choose the file you exported from Library → Export on the other device.
- **ES** {name} no es una exportación de LibrAPP. Elige el archivo que exportaste desde Biblioteca → Exportar en el otro dispositivo.
- **→**

#### `error.notJson`

- **EN** {name} is not readable as JSON. It may have been renamed, or downloaded only in part.
- **ES** {name} no se puede leer como JSON. Puede que se haya renombrado o descargado a medias.
- **→**

---

## Estado de lectura (3)

#### `read.read`

- **EN** read
- **ES** leído
- **→**

#### `read.unread`

- **EN** unread
- **ES** sin leer
- **→**

#### `read.unknown` ⚠️

> "sin constancia" suena jurídico. ¿"sin datos" / "no consta"?

- **EN** not recorded
- **ES** sin constancia
- **→** no consta

---

## Ficha de un libro (21)

#### `book.series`

- **EN** Series
- **ES** Serie
- **→**

#### `book.volume`

- **EN** vol.
- **ES** vol.
- **→**

#### `book.formats`

- **EN** Formats
- **ES** Formatos
- **→**

#### `book.read` ⚠️

> Etiqueta de campo: ¿"Leído" o "¿Leído?"?

- **EN** Read
- **ES** Leído
- **→**

#### `book.acquired`

- **EN** Acquired
- **ES** Adquirido
- **→**

#### `book.publisher`

- **EN** Publisher
- **ES** Editorial
- **→**

#### `book.genre`

- **EN** Genre
- **ES** Género
- **→**

#### `book.where`

- **EN** Where
- **ES** Dónde
- **→**

#### `book.collections`

- **EN** Collections
- **ES** Colecciones
- **→**

#### `book.devices`

- **EN** Devices
- **ES** Dispositivos
- **→**

#### `book.sources`

- **EN** Sources
- **ES** Fuentes
- **→**

#### `book.tags`

- **EN** Tags
- **ES** Etiquetas
- **→**

#### `book.worthKnowing`

- **EN** Worth knowing
- **ES** Conviene saber
- **→**

#### `book.confidence`

- **EN** Confidence
- **ES** Confianza
- **→**

#### `book.notedWhenRead`

- **EN** Noted when read:
- **ES** Anotado al leerlo:
- **→**

#### `book.unknownNote`

- **EN** Nothing has ever recorded whether this was read. That is not the same as unread, so it is left blank rather than guessed.
- **ES** Nadie ha dejado constancia de si lo leíste. Eso no es lo mismo que no haberlo leído, así que se deja en blanco en vez de suponerlo.
- **→** No consta si lo leíste.

#### `book.corrected`

- **EN** Corrected by hand.
- **ES** Corregido a mano.
- **→**

#### `book.correctedOn`

- **EN** Corrected by hand on {date}.
- **ES** Corregido a mano el {date}.
- **→**

#### `book.correctedFields`

- **EN** {fields} - overriding what the sources say.
- **ES** {fields} — por encima de lo que dicen las fuentes.
- **→**

#### `book.before`

- **EN** Before:
- **ES** Antes:
- **→**

#### `book.undoCorrection`

- **EN** Undo this correction
- **ES** Deshacer esta corrección
- **→**

---

## Avisos sobre un libro (7)

#### `flag.title_clipped`

- **EN** the title is cut off - no source had it whole
- **ES** el título está cortado: ninguna fuente lo tenía entero
- **→**

#### `flag.illegible_spine`

- **EN** the spine could not be read properly
- **ES** el lomo no se pudo leer bien
- **→**

#### `flag.no_personal_author`

- **EN** no named author: a reference work, anthology or anonymous text
- **ES** sin autor con nombre: obra de referencia, antología o texto anónimo
- **→**

#### `flag.no_genre`

- **EN** no genre recorded yet
- **ES** todavía sin género
- **→**

#### `flag.placeholder`

- **EN** a stand-in, not a real title - re-photograph this one
- **ES** un marcador de posición, no un título real: vuelve a fotografiarlo
- **→**

#### `flag.series_not_expanded`

- **EN** stands for several volumes no source lists individually
- **ES** representa varios volúmenes que ninguna fuente lista por separado
- **→**

#### `flag.corrected`

- **EN** you corrected this entry by hand
- **ES** corregiste esta entrada a mano
- **→**

---

## Confianza (6)

#### `confidence.high`

- **EN** high
- **ES** alta
- **→**

#### `confidence.medium`

- **EN** medium
- **ES** media
- **→**

#### `confidence.low`

- **EN** low
- **ES** baja
- **→**

#### `confidence.high.why`

- **EN** from a machine-readable source, checked against its own count
- **ES** de una fuente legible por máquina, contrastada con su propio recuento
- **→**

#### `confidence.medium.why`

- **EN** transcribed by eye or by model
- **ES** transcrito a ojo o por un modelo
- **→**

#### `confidence.low.why`

- **EN** a guess
- **ES** una suposición
- **→**

---

## Formatos (3)

#### `format.physical`

- **EN** physical
- **ES** en papel
- **→**

#### `format.ebook`

- **EN** ebook
- **ES** ebook
- **→**

#### `format.audio`

- **EN** audio
- **ES** audiolibro
- **→**

---

## Subir una lista (16)

#### `list.intro`

- **EN** A spreadsheet, a CSV, an XML catalog, or a store export as PDF. Columns are matched by name in several languages, so a sheet headed Autor / Título / Género works as well as author / title / genre. Everything is read on this device.
- **ES** Una hoja de cálculo, un CSV, un catálogo en XML o un extracto de tienda en PDF. Las columnas se reconocen por su nombre en varios idiomas, así que una hoja con Autor / Título / Género funciona igual que una con author / title / genre. Todo se lee en este dispositivo.
- **→** Una hoja de cálculo, un CSV, un catálogo en XML o una lista en PDF. Las columnas se reconocen por su nombre en varios idiomas, así que una hoja con Autor / Título / Género funciona igual que una con author / title / genre. Todo se lee en este dispositivo.

#### `list.drop`

- **EN** Drop a list
- **ES** Suelta aquí una lista
- **→**

#### `list.reading`

- **EN** Reading it…
- **ES** Leyéndola…
- **→**

#### `list.whatIsIn`

- **EN** What is in {name}?
- **ES** ¿Qué hay en {name}?
- **→**

#### `list.manyLists`

- **EN** This file holds more than one list. Pick the one you actually own — importing a wishlist as your library is the mistake worth one extra question.
- **ES** Este archivo contiene más de una lista. Elige la de los libros que de verdad tienes: importar una lista de deseos como si fuera tu biblioteca es el error que merece una pregunta más.
- **→** Este archivo contiene más de una lista. Elige la de los libros que de verdad tienes.

#### `list.whichList`

- **EN** Which list
- **ES** Qué lista
- **→**

#### `list.callIt` ⚠️

> "Llámala" concuerda con "la lista"; comprobar que el contexto lo justifica.

- **EN** Call it
- **ES** Llámala
- **→**

#### `list.theseAre`

- **EN** These are
- **ES** Son
- **→**

#### `list.trust`

- **EN** Trust
- **ES** Confianza
- **→**

#### `list.importAction`

- **EN** Import and rebuild
- **ES** Importar y reconstruir
- **→**

#### `list.theseAreNote`

- **EN** is only a fallback: rows naming their own format keep it.
- **ES** es solo un valor por defecto: las filas que indican su propio formato lo conservan.
- **→**

#### `list.trustNote`

- **EN** decides who wins when two sources disagree about the same book — a verified export outranks a hand-kept list.
- **ES** decide quién gana cuando dos fuentes discrepan sobre el mismo libro: un extracto verificado pesa más que una lista hecha a mano.
- **→**

#### `list.imported`

- **EN** {n} records imported.
- **ES** {n} registros importados.
- **→**

#### `list.nowHolds`

- **EN** The catalog now holds {n} books.
- **ES** El catálogo tiene ahora {n} libros.
- **→**

#### `list.declared`

- **EN** The export declares {declared} items and {read} were read — a difference of {difference}.
- **ES** El extracto declara {declared} elementos y se leyeron {read}: una diferencia de {difference}.
- **→**

#### `list.savedAs`

- **EN** Saved as {name}.
- **ES** Guardado como {name}.
- **→**

---

## Catálogo (29)

#### `catalog.empty.title`

- **EN** No catalog yet
- **ES** Todavía no hay catálogo
- **→**

#### `catalog.empty.body`

- **EN** Nothing has been ingested. Start with a photograph of a shelf, or with a list you already keep — either one on its own is enough to build a catalog.
- **ES** Aún no se ha incorporado nada. Empieza por una foto de una estantería o por una lista que ya tengas: cualquiera de las dos, por sí sola, basta para construir un catálogo.
- **→** Aún no se ha incorporado nada. Empieza por una foto de una estantería o por una lista que ya tengas: cualquiera de las dos basta para construir un catálogo.

#### `catalog.empty.shelf`

- **EN** Read a shelf photograph
- **ES** Leer una foto de la estantería
- **→**

#### `catalog.empty.list`

- **EN** Upload a list
- **ES** Subir una lista
- **→**

#### `catalog.typeIn`

- **EN** Type a book in
- **ES** Escribir un libro
- **→**

#### `catalog.countOne` ⚠️

> Comprobar singular/plural con catalog.countAll.

- **EN** {total} book
- **ES** {total} libro
- **→**

#### `catalog.countAll` ⚠️

> Comprobar singular/plural con catalog.countOne.

- **EN** {total} books
- **ES** {total} libros
- **→**

#### `catalog.countSome`

- **EN** {shown} of {total} books
- **ES** {shown} de {total} libros
- **→**

#### `catalog.builtAt`

- **EN** built {when}
- **ES** construido el {when}
- **→**

#### `catalog.correctedCount`

- **EN** {n} corrected
- **ES** {n} corregidos
- **→**

#### `catalog.removedCount`

- **EN** {n} removed
- **ES** {n} retirados
- **→**

#### `catalog.searchPlaceholder`

- **EN** Search titles, authors, series, tags…
- **ES** Busca títulos, autores, series, etiquetas…
- **→**

#### `catalog.searchLabel`

- **EN** Search the catalog
- **ES** Buscar en el catálogo
- **→**

#### `catalog.clearSearch`

- **EN** Clear search
- **ES** Borrar la búsqueda
- **→**

#### `catalog.groupBy`

- **EN** Group by
- **ES** Agrupar por
- **→**

#### `catalog.group.title`

- **EN** Title
- **ES** Título
- **→**

#### `catalog.group.author`

- **EN** Author
- **ES** Autor
- **→**

#### `catalog.group.series`

- **EN** Series
- **ES** Serie
- **→**

#### `catalog.any`

- **EN** any
- **ES** cualquiera
- **→**

#### `catalog.format`

- **EN** Format
- **ES** Formato
- **→**

#### `catalog.source`

- **EN** Source
- **ES** Fuente
- **→**

#### `catalog.sort`

- **EN** Sort
- **ES** Orden
- **→**

#### `catalog.sort.title`

- **EN** title
- **ES** título
- **→**

#### `catalog.sort.author`

- **EN** author
- **ES** autor
- **→**

#### `catalog.sort.newest`

- **EN** newest first
- **ES** más recientes primero
- **→**

#### `catalog.sort.oldest`

- **EN** oldest first
- **ES** más antiguos primero
- **→**

#### `catalog.noMatch`

- **EN** Nothing matches.
- **ES** No hay nada que coincida.
- **→** No hay coincidencias.

#### `catalog.clearFilters`

- **EN** Clear the filters
- **ES** Quitar los filtros
- **→**

#### `catalog.standalone` ⚠️

> "Sueltos" es ambiguo. ¿"Sin serie"?

- **EN** Standalone
- **ES** Sueltos
- **→** Sin serie

---

## Biblioteca (49)

#### `storage.intro`

- **EN** Where your catalog lives, what it was built from, and how to move it to another device.
- **ES** Dónde vive tu catálogo, con qué se construyó y cómo llevarlo a otro dispositivo.
- **→**

#### `storage.where`

- **EN** Storage
- **ES** Almacenamiento
- **→**

#### `storage.kind.folder`

- **EN** a folder you chose — plain files you can open, back up or commit
- **ES** una carpeta que elegiste — archivos normales que puedes abrir, copiar o versionar
- **→**

#### `storage.kind.browser`

- **EN** browser storage — private to LibrAPP, and only leaves by export
- **ES** almacenamiento del navegador — privado para LibrAPP; solo sale de aquí exportando
- **→**

#### `storage.kind.unknown`

- **EN** unknown
- **ES** desconocido
- **→**

#### `storage.using`

- **EN** Using {used} of about {quota} the browser allows this app.
- **ES** Usando {used} de los {quota} que el navegador concede a esta app.
- **→**

#### `storage.notPersistent`

- **EN** This storage is not marked persistent.
- **ES** Este almacenamiento no está marcado como persistente.
- **→**

#### `storage.notPersistentBody`

- **EN** The browser may clear it if the device runs short of space, and your library would go with it. Installing LibrAPP usually earns persistence; until then, keep an export.
- **ES** El navegador puede borrarlo si al dispositivo le falta espacio, y tu biblioteca se iría con él. Instalar LibrAPP suele bastar para conseguir la persistencia; mientras tanto, guarda una exportación.
- **→**

#### `storage.askPersistent`

- **EN** Ask for persistent storage
- **ES** Pedir almacenamiento persistente
- **→**

#### `storage.persistent`

- **EN** Marked persistent — the browser will not clear it to reclaim space.
- **ES** Marcado como persistente: el navegador no lo borrará para recuperar espacio.
- **→**

#### `storage.elsewhere`

- **EN** Use a different location
- **ES** Usar otra ubicación
- **→**

#### `storage.forgetNote`

- **EN** This forgets where the library is; it does not delete anything.
- **ES** Esto olvida dónde está la biblioteca; no borra nada.
- **→**

#### `storage.sources`

- **EN** Sources
- **ES** Fuentes
- **→**

#### `storage.noSources`

- **EN** Nothing ingested yet.
- **ES** Todavía no se ha incorporado nada.
- **→**

#### `storage.col.name`

- **EN** name
- **ES** nombre
- **→**

#### `storage.col.kind`

- **EN** kind
- **ES** tipo
- **→**

#### `storage.col.from`

- **EN** from
- **ES** de
- **→**

#### `storage.col.trust`

- **EN** trust
- **ES** confianza
- **→**

#### `storage.col.records`

- **EN** records
- **ES** registros
- **→**

#### `storage.sourcesNote`

- **EN** Every source stays as its ingester wrote it. Rebuilding merges all of them, so removing one and rebuilding is how an import is undone.
- **ES** Cada fuente se conserva tal como la escribió su lector. Reconstruir las combina todas, así que quitar una y reconstruir es la forma de deshacer una importación.
- **→**

#### `storage.sourceRemoved`

- **EN** Removed {name}.
- **ES** {name} eliminada.
- **→**

#### `storage.browser`

- **EN** Your browser
- **ES** Tu navegador
- **→**

#### `storage.browserNote`

- **EN** Checked by trying each feature, not by reading the browser name — so this is what your browser can actually do, whichever one it is.
- **ES** Se comprueba probando cada función, no leyendo el nombre del navegador: esto es lo que el tuyo puede hacer de verdad, sea cual sea.
- **→**

#### `storage.allSupported`

- **EN** everything supported
- **ES** todo soportado
- **→**

#### `storage.someMissing`

- **EN** {n} feature(s) unavailable
- **ES** {n} función(es) no disponibles
- **→**

#### `storage.notSupported`

- **EN** not supported
- **ES** no soportado
- **→**

#### `storage.yes`

- **EN** yes
- **ES** sí
- **→**

#### `storage.no`

- **EN** no
- **ES** no
- **→**

#### `storage.missing`

- **EN** missing
- **ES** falta
- **→**

#### `storage.cannotRun`

- **EN** LibrAPP cannot run properly in this browser. Try a current version of Chrome, Edge, Brave, Firefox or Safari.
- **ES** LibrAPP no puede funcionar bien en este navegador. Prueba con una versión actual de Chrome, Edge, Brave, Firefox o Safari.
- **→**

#### `storage.corrections`

- **EN** Corrections you have made
- **ES** Correcciones que has hecho
- **→**

#### `storage.correctionsNote`

- **EN** Kept apart from your sources and applied after every rebuild. Removing a book cannot delete it — the next rebuild reads the same sources and would put it back — so a removal is recorded here instead, and can be undone.
- **ES** Se guardan aparte de tus fuentes y se aplican después de cada reconstrucción. Quitar un libro no puede borrarlo — la siguiente reconstrucción lee las mismas fuentes y volvería a ponerlo — así que la retirada se anota aquí y se puede deshacer.
- **→**

#### `storage.noCorrections`

- **EN** Nothing corrected yet.
- **ES** Todavía no has corregido nada.
- **→**

#### `storage.removedGroup`

- **EN** Removed ({n})
- **ES** Retirados ({n})
- **→**

#### `storage.editedGroup`

- **EN** Edited ({n})
- **ES** Editados ({n})
- **→**

#### `storage.changed`

- **EN** changed {fields}
- **ES** cambiado: {fields}
- **→**

#### `storage.orphaned`

- **EN** {n} correction(s) no longer match any book.
- **ES** {n} corrección(es) ya no corresponden a ningún libro.
- **→**

#### `storage.orphanedNote`

- **EN** An entry is identified by its author and title, so this happens when a better source supplies a fuller title and the identity changes. They are listed rather than dropped, because silence would look like the correction had stopped mattering.
- **ES** Una entrada se identifica por su autor y su título, así que esto ocurre cuando una fuente mejor aporta un título más completo y cambia la identidad. Se listan en vez de descartarse, porque el silencio parecería decir que la corrección ha dejado de importar.
- **→**

#### `storage.wasRemoved`

- **EN** was removed
- **ES** fue retirado
- **→**

#### `storage.wasEdited`

- **EN** was edited
- **ES** fue editado
- **→**

#### `storage.forgetIt` ⚠️

> "Olvidarla" concuerda con "la corrección"; comprobar.

- **EN** Forget it
- **ES** Olvidarla
- **→** Olvidar

#### `storage.undone`

- **EN** Correction to {what} undone.
- **ES** Corrección de {what} deshecha.
- **→**

#### `storage.restored`

- **EN** {what} restored.
- **ES** {what} restaurado.
- **→**

#### `storage.move`

- **EN** Move this library elsewhere
- **ES** Llevar esta biblioteca a otro sitio
- **→**

#### `storage.moveNote`

- **EN** An export holds the sources, not the catalog. The catalog is rebuilt from them on the other side, so the two copies cannot drift into disagreeing about which is current.
- **ES** Una exportación contiene las fuentes, no el catálogo. El catálogo se reconstruye a partir de ellas al otro lado, de modo que las dos copias no pueden acabar discrepando sobre cuál es la buena.
- **→**

#### `storage.exported`

- **EN** Exported {n} source(s).
- **ES** {n} fuente(s) exportadas.
- **→**

#### `storage.importTitle`

- **EN** Import an export
- **ES** Importar una exportación
- **→** Importar

#### `storage.importHint`

- **EN** choose the .json file you exported — it is added, then rebuilt
- **ES** elige el archivo .json que exportaste; se añade y se reconstruye
- **→**

#### `storage.imported`

- **EN** Imported {n} source(s) and rebuilt.
- **ES** {n} fuente(s) importadas y catalogo reconstruido.
- **→**

---

## Capacidades del navegador (27)

#### `cap.secure.label`

- **EN** Secure page (HTTPS or localhost)
- **ES** Página segura (HTTPS o localhost)
- **→**

#### `cap.secure.needed`

- **EN** everything below
- **ES** todo lo de abajo
- **→**

#### `cap.secure.fix`

- **EN** Open LibrAPP over https://, not http://.
- **ES** Abre LibrAPP por https://, no por http://.
- **→**

#### `cap.indexeddb.label`

- **EN** IndexedDB
- **ES** IndexedDB
- **→**

#### `cap.indexeddb.needed`

- **EN** remembering your settings and where your library is
- **ES** recordar tus ajustes y dónde está tu biblioteca
- **→**

#### `cap.indexeddb.fix`

- **EN** Private or incognito windows sometimes disable this.
- **ES** Las ventanas privadas o de incógnito a veces lo desactivan.
- **→**

#### `cap.opfs.label`

- **EN** Private file storage
- **ES** Almacenamiento privado de archivos
- **→**

#### `cap.opfs.needed`

- **EN** keeping your library inside the browser
- **ES** guardar tu biblioteca dentro del navegador
- **→**

#### `cap.opfs.fix`

- **EN** Without it LibrAPP has nowhere to keep a catalog.
- **ES** Sin esto LibrAPP no tiene dónde guardar un catálogo.
- **→**

#### `cap.regex.label`

- **EN** Modern regular expressions
- **ES** Expresiones regulares modernas
- **→**

#### `cap.regex.needed`

- **EN** matching titles and author names
- **ES** reconocer títulos y nombres de autor
- **→**

#### `cap.regex.fix`

- **EN** Needs Safari 16.4 or later, or any current browser.
- **ES** Necesita Safari 16.4 o posterior, o cualquier navegador actual.
- **→**

#### `cap.folder.label`

- **EN** Folder access
- **ES** Acceso a carpetas
- **→**

#### `cap.folder.needed`

- **EN** saving your library to a folder you choose
- **ES** guardar tu biblioteca en una carpeta que elijas
- **→**

#### `cap.folder.fix`

- **EN** Only Chrome and Edge on a desktop offer this. Everywhere else LibrAPP uses its own storage, which works the same but is not visible to other programs.
- **ES** Solo Chrome y Edge de escritorio lo ofrecen. En los demás, LibrAPP usa su propio almacenamiento, que funciona igual pero no es visible para otros programas.
- **→**

#### `cap.unzip.label`

- **EN** Decompression
- **ES** Descompresión
- **→**

#### `cap.unzip.needed`

- **EN** reading .xlsx spreadsheets
- **ES** leer hojas .xlsx
- **→**

#### `cap.unzip.fix`

- **EN** CSV, XML and PDF imports still work. Needs Firefox 113 or Safari 16.4 and later.
- **ES** Las importaciones de CSV, XML y PDF siguen funcionando. Necesita Firefox 113 o Safari 16.4 y posteriores.
- **→**

#### `cap.canvas.label`

- **EN** Offscreen canvas
- **ES** Lienzo fuera de pantalla
- **→**

#### `cap.canvas.needed`

- **EN** cutting a photograph into readable tiles
- **ES** cortar una foto en piezas legibles
- **→**

#### `cap.canvas.fix`

- **EN** Without it, import your books from a list instead of a photograph.
- **ES** Sin esto, importa tus libros desde una lista en vez de desde una foto.
- **→**

#### `cap.bitmap.label`

- **EN** Image decoding
- **ES** Decodificación de imágenes
- **→**

#### `cap.bitmap.needed`

- **EN** opening the photograph you choose
- **ES** abrir la foto que elijas
- **→**

#### `cap.bitmap.fix`

- **EN** Without it, import your books from a list instead of a photograph.
- **ES** Sin esto, importa tus libros desde una lista en vez de desde una foto.
- **→**

#### `cap.sw.label`

- **EN** Service workers
- **ES** Service workers
- **→**

#### `cap.sw.needed`

- **EN** installing LibrAPP and using it offline
- **ES** instalar LibrAPP y usarlo sin conexión
- **→**

#### `cap.sw.fix`

- **EN** LibrAPP still runs, but only while you have a connection.
- **ES** LibrAPP sigue funcionando, pero solo mientras tengas conexión.
- **→**

---

## Foto de la estantería (41)

#### `shelf.intro`

- **EN** Photograph a shelf straight on, at your camera’s full resolution. This matters more than anything else here: a whole bookcase at one megapixel is unreadable, and the same shelf at fifty is not.
- **ES** Fotografía la estantería de frente y a la resolución máxima de tu cámara. Esto importa más que ninguna otra cosa: una librería entera a un megapíxel es ilegible, y esa misma estantería a cincuenta no lo es.
- **→** Fotografía la estantería de frente a una resolución alta.

#### `shelf.whatItIsFor`

- **EN** reading a shelf
- **ES** leer una estantería
- **→**

#### `shelf.step1`

- **EN** 1 · The photograph
- **ES** 1 · La foto
- **→**

#### `shelf.dropPhoto`

- **EN** Take or choose a photograph
- **ES** Haz o elige una foto
- **→**

#### `shelf.dropPhotoHint`

- **EN** JPEG or PNG · nothing is uploaded
- **ES** JPEG o PNG · no se sube nada
- **→**

#### `shelf.cutting`

- **EN** Cutting it into tiles…
- **ES** Cortándola en piezas…
- **→** Creando cuadricula...

#### `shelf.step2`

- **EN** 2 · Read the spines
- **ES** 2 · Leer los lomos
- **→**

#### `shelf.tileCount`

- **EN** {n} tile(s)
- **ES** {n} pieza(s)
- **→**

#### `shelf.tilesNote` ⚠️

> ERROR: "Pasáselas" → "Pásaselas" (o "Dáselas"); "pidele" → "pídele".

- **EN** Tiles are cut at native resolution and overlap, so a book on a seam is whole in one of them. Give them to a model along with the instructions below, and have it write the transcription.
- **ES** Las piezas se cortan a resolución nativa y se solapan, de modo que un libro que cae en una junta aparece entero en alguna de ellas. Pasáselas a un modelo junto con las instrucciones de abajo y pidele que escriba la transcripción.
- **→** La cuadrícula se corta a resolución nativa y se solapa, de modo que un libro que cae en una junta aparece entero en alguna de ellas. Pasáselas a un modelo junto con las instrucciones de abajo y pidele que escriba la transcripción.

#### `shelf.grid`

- **EN** Grid · {cols} across × {rows} down
- **ES** Rejilla · {cols} de ancho × {rows} de alto
- **→**

#### `shelf.lessAcross`

- **EN** − across
- **ES** − ancho
- **→** - columnas

#### `shelf.moreAcross`

- **EN** + across
- **ES** + ancho
- **→** + columnas

#### `shelf.lessDown`

- **EN** − down
- **ES** − alto
- **→** - filas

#### `shelf.moreDown`

- **EN** + down
- **ES** + alto
- **→** + filas

#### `shelf.gridNote`

- **EN** Aim for tiles holding a handful of whole spines, with the title readable top to bottom. No setting suits every shelf: a wide bookcase wants several tiles across, and a close-up of three books wants one and nothing more.
- **ES** Busca piezas con unos pocos lomos enteros y el título legible de arriba abajo. Ningún ajuste vale para todas las estanterías: una librería ancha pide varias piezas a lo ancho, y un primer plano de tres libros pide una y nada más.
- **→** Trata de tener unos pocos lomos enteros y el título legible. Ningún ajuste vale para todas las estanterías: una ancha pide mas columnas a lo ancho, y un primer plano de tres libros pide una y nada más.

#### `shelf.gridWarning`

- **EN** Adding rows is what splits a title in half
- **ES** Añadir filas es lo que parte un título por la mitad
- **→** Añadir filas puede cortar un título por la mitad

#### `shelf.gridWarningTail`

- **EN** , so add those only when the photograph really shows shelves stacked above one another.
- **ES** , así que añádelas solo cuando la foto muestre de verdad baldas una encima de otra.
- **→**

#### `shelf.backToSuggested`

- **EN** back to the suggested {cols}×{rows}
- **ES** volver a la sugerida de {cols}×{rows}
- **→**

#### `shelf.reading`

- **EN** reading the spines…
- **ES** leyendo los lomos…
- **→**

#### `shelf.readForMe`

- **EN** Read these tiles for me
- **ES** Lee estas piezas por mí
- **→** Lee estas fotos por mí

#### `shelf.tokensOnly`

- **EN** about {k}k tokens in, at your own rate
- **ES** unos {k}k tokens de entrada, a tu tarifa
- **→**

#### `shelf.youApprove`

- **EN** you approve the result before anything is imported
- **ES** apruebas el resultado antes de que se importe nada
- **→**

#### `shelf.copyInstructions`

- **EN** Copy the instructions
- **ES** Copiar las instrucciones
- **→**

#### `shelf.hideThem`

- **EN** Hide them
- **ES** Ocultarlas
- **→**

#### `shelf.readThem`

- **EN** Read them
- **ES** Leerlas
- **→**

#### `shelf.saveAll`

- **EN** Save all tiles
- **ES** Guardar todas las piezas
- **→** Guardar la cuadrícula

#### `shelf.tileAlt`

- **EN** Tile row {row}, column {column}
- **ES** Pieza fila {row}, columna {column}
- **→**

#### `shelf.step3`

- **EN** 3 · Check what it read
- **ES** 3 · Comprueba lo que ha leído
- **→**

#### `shelf.bookCount`

- **EN** {n} book(s)
- **ES** {n} libro(s)
- **→**

#### `shelf.cost`

- **EN** cost {amount}
- **ES** coste {amount}
- **→**

#### `shelf.checkNote`

- **EN** Nothing has been imported yet. A model reading a spine can be wrong in a way the catalog cannot detect later, so this is the moment to look. Anything marked uncertain is worth checking against the tiles above.
- **ES** Todavía no se ha importado nada. Un modelo leyendo un lomo puede equivocarse de una forma que el catálogo ya no podrá detectar después, así que este es el momento de mirar. Lo marcado como dudoso merece un contraste con las piezas de arriba.
- **→** Todavía no se ha importado nada. Un modelo leyendo un lomo puede equivocarse de una forma que el catálogo ya no podrá detectar después, así que este es el momento de mirar. Lo marcado como dudoso merece un contraste con las fotos de arriba.

#### `shelf.unplaced`

- **EN** unplaced
- **ES** sin ubicar
- **→**

#### `shelf.importThese`

- **EN** Import these {n} books
- **ES** Importar estos {n} libros
- **→**

#### `shelf.discard`

- **EN** Discard
- **ES** Descartar
- **→**

#### `shelf.stepBring`

- **EN** {n} · Bring a transcription back yourself
- **ES** {n} · Trae tú la transcripción
- **→**

#### `shelf.bringNote`

- **EN** The route that needs no key: read the tiles in any AI session with the instructions above, and drop the JSON here. The import refuses a file with an untitled book or an unknown confidence value — a bad read should stop here rather than turn up in your catalog later.
- **ES** La vía que no necesita clave: lee las piezas en cualquier sesión de IA con las instrucciones de arriba y suelta aquí el JSON. La importación rechaza un archivo con un libro sin título o con un valor de confianza desconocido: una mala lectura debe pararse aquí y no aparecer luego en tu catálogo.
- **→** Aquí no necesitas claves: añade las fotos junto con las instrucciones de arriba en cualquier sesión de IA, y trae aquí el resultado (.JSON). La importación rechaza un archivo con un libro sin título o con un valor de confianza desconocido.

#### `shelf.dropTranscription`

- **EN** Drop the transcription
- **ES** Suelta aquí la transcripción
- **→**

#### `shelf.dropTranscriptionHint`

- **EN** the JSON file the model wrote
- **ES** el archivo JSON que escribió el modelo
- **→**

#### `shelf.result`

- **EN** {n} books read from the photograph.
- **ES** {n} libros leídos de la foto.
- **→**

#### `shelf.uncertain`

- **EN** {n} spine(s) uncertain
- **ES** {n} lomo(s) dudosos
- **→**

#### `shelf.resultNote`

- **EN** A photograph cannot see a purchase date or whether you read something, so those stay unknown until another source says.
- **ES** Una foto no puede ver la fecha de compra ni si lo has leído, así que eso queda sin saber hasta que lo diga otra fuente.
- **→**

---

## El escritorio (34)

#### `desk.nothingYet`

- **EN** Nothing to work with yet — build a catalog first.
- **ES** Aún no hay con qué trabajar: construye primero un catálogo.
- **→**

#### `desk.intro`

- **EN** Where the catalog stops being a list and starts being an argument. Everything on the left is computed locally. The right-hand side prepares a question for a model — your shelf is what makes the answer yours rather than generic.
- **ES** Donde el catálogo deja de ser una lista y empieza a ser un argumento. Todo lo de la izquierda se calcula aquí mismo. La derecha prepara una pregunta para un modelo: tu estantería es lo que hace que la respuesta sea tuya y no genérica.
- **→** Donde tu catálogo deja de ser simplemente una lista y empieza a ser un recurso. A la derecha se prepara una pregunta para un modelo de IA: tu catálogo es lo que hace que la respuesta sea tuya y no genérica.

#### `desk.neverOpened`

- **EN** Bought, and never opened
- **ES** Comprados y nunca abiertos
- **→**

#### `desk.waitingAtLeast`

- **EN** waiting at least
- **ES** esperando al menos
- **→**

#### `desk.year` ⚠️

> Comprobar la concordancia de singular/plural con desk.years.

- **EN** {n} year
- **ES** {n} año
- **→**

#### `desk.years` ⚠️

> Comprobar la concordancia de singular/plural con desk.year.

- **EN** {n} years
- **ES** {n} años
- **→**

#### `desk.yearsShort` ⚠️

> ERROR: da "1 años" para un año, y usa punto decimal donde el español usa coma.

- **EN** {n} yr
- **ES** {n} años
- **→**

#### `desk.neverOpenedNote`

- **EN** Ordered by how long they have waited, weighted by how much you evidently wanted them at the time. Only books known to be unread appear — {unknown} books have no reading record at all, and guessing would bury this list under books you already finished.
- **ES** Ordenados por lo que llevan esperando, ponderado por las ganas que tenías de ellos entonces. Solo aparecen los libros de los que consta que no has leído: {unknown} libros no tienen ninguna constancia de lectura, y suponerla enterraría esta lista bajo libros que ya terminaste.
- **→** Ordenados por lo que llevan esperando, ponderado por las ganas que tenías de ellos entonces. Solo aparecen los libros de los que consta que no has leído: {unknown} libros no tienen ninguna constancia de lectura.

#### `desk.nothingWaited`

- **EN** Nothing has waited that long.
- **ES** Nada lleva esperando tanto tiempo.
- **→**

#### `desk.showFive`

- **EN** Show only the first five
- **ES** Ver solo los cinco primeros
- **→**

#### `desk.showAll`

- **EN** Show all {n}
- **ES** Ver los {n}
- **→**

#### `desk.madeOf`

- **EN** What the collection is made of
- **ES** De qué se compone la colección
- **→**

#### `desk.ask`

- **EN** Ask
- **ES** Preguntar
- **→**

#### `desk.whatItIsFor`

- **EN** the desk
- **ES** el escritorio
- **→**

#### `desk.synopsis`

- **EN** Synopsis
- **ES** Sinopsis
- **→**

#### `desk.synopsis.placeholder`

- **EN** Which book? It does not have to be one you own.
- **ES** ¿Qué libro? No hace falta que sea tuyo.
- **→**

#### `desk.synopsis.blurb`

- **EN** Describes a book to someone whose shelf is in front of you — what it argues, what it is reacting against, and how it stands against books you already have.
- **ES** Describe un libro a alguien que tiene tu estantería delante: qué sostiene, contra qué reacciona y cómo se sitúa frente a los libros que ya tienes.
- **→**

#### `desk.recommend`

- **EN** Recommendation
- **ES** Recomendación
- **→**

#### `desk.recommend.placeholder`

- **EN** Anything to steer it? “something for a long flight”, or leave blank.
- **ES** ¿Algo que la oriente? «algo para un vuelo largo», o déjalo en blanco.
- **→**

#### `desk.recommend.blurb`

- **EN** Two or three books, never more, chosen against where your reading is going rather than where it has been — and it checks the unread pile before suggesting a purchase.
- **ES** Dos o tres libros, nunca más, elegidos por dónde va tu lectura y no por dónde ha estado; y antes de proponerte una compra mira lo que tienes sin leer.
- **→**

#### `desk.askService`

- **EN** Ask {service}
- **ES** Preguntar a {service}
- **→**

#### `desk.askForMe`

- **EN** Ask for me
- **ES** Pregunta por mí
- **→**

#### `desk.thinking`

- **EN** thinking…
- **ES** pensando…
- **→**

#### `desk.copyRequest`

- **EN** Copy the whole request
- **ES** Copiar la petición entera
- **→**

#### `desk.copyProfile`

- **EN** Copy just the profile
- **ES** Copiar solo el perfil
- **→**

#### `desk.copyAnswer`

- **EN** Copy the answer
- **ES** Copiar la respuesta
- **→**

#### `desk.answer`

- **EN** Answer
- **ES** Respuesta
- **→**

#### `desk.streaming`

- **EN** streaming…
- **ES** llegando…
- **→**

#### `desk.withKey`

- **EN** With a key, LibrAPP asks on your behalf. Without one it assembles the request for you to paste into any AI session — the same instructions, the same profile, the same question.
- **ES** Con una clave, LibrAPP pregunta en tu nombre. Sin ella, monta la petición para que la pegues en cualquier sesión de IA: las mismas instrucciones, el mismo perfil, la misma pregunta.
- **→**

#### `desk.withoutKey`

- **EN** LibrAPP assembles the instructions, your reading profile and your question into one block — paste it into any AI session you already use. Add a key below and it can ask for you instead.
- **ES** LibrAPP reúne las instrucciones, tu perfil de lectura y tu pregunta en un solo bloque: pégalo en la sesión de IA que ya uses. Añade abajo una clave y podrá preguntar por ti.
- **→**

#### `desk.promptsNote`

- **EN** The prompts are kept as plain text, so you can edit how it asks.
- **ES** Las instrucciones se guardan como texto plano, así que puedes cambiar cómo pregunta.
- **→**

#### `desk.profile`

- **EN** Your reading profile
- **ES** Tu perfil de lectura
- **→**

#### `desk.characters`

- **EN** {n} characters
- **ES** {n} caracteres
- **→**

#### `desk.profileNote`

- **EN** Deliberately not the whole catalog — a few hundred titles crowd out the question. This is the shape of the collection and how it has moved, with enough named books to argue from.
- **ES** A propósito no es el catálogo entero: unos cientos de títulos ahogan la pregunta. Esto es la forma de la colección y cómo se ha movido, con suficientes libros con nombre como para argumentar.
- **→** No usa tu catálogo entero a propósito: cientos de títulos ahogarían la pregunta. Esto es la forma de la colección y cómo se ha movido, con suficientes libros con nombre como para argumentar.

---

## Editar un libro (19)

#### `editor.add`

- **EN** Add a book
- **ES** Añadir un libro
- **→**

#### `editor.correct`

- **EN** Correct this entry
- **ES** Corregir esta entrada
- **→**

#### `editor.addNote`

- **EN** This becomes a record in your manual source and merges like any other. If a book you type in is already in the catalog from somewhere else, you get one entry that knows both.
- **ES** Esto pasa a ser un registro de tu fuente manual y se combina como cualquier otro. Si el libro que escribes ya está en el catálogo por otra vía, obtienes una sola entrada que conoce las dos.
- **→**

#### `editor.correctNote`

- **EN** This is recorded as a correction, kept apart from your sources and applied after every rebuild. It outranks whatever the sources say, and can be undone.
- **ES** Esto se anota como una corrección, aparte de tus fuentes y aplicada después de cada reconstrucción. Pesa más que lo que digan las fuentes y se puede deshacer.
- **→**

#### `editor.title`

- **EN** Title
- **ES** Título
- **→**

#### `editor.authors`

- **EN** Authors
- **ES** Autores
- **→**

#### `editor.authorsHint`

- **EN** separate several with commas; leave blank for an anonymous work
- **ES** separa varios con comas; déjalo en blanco si la obra es anónima
- **→**

#### `editor.volume`

- **EN** Volume
- **ES** Volumen
- **→**

#### `editor.readHint`

- **EN** blank means nobody recorded it
- **ES** en blanco significa que nadie lo anotó
- **→**

#### `editor.where`

- **EN** Where it is
- **ES** Dónde está
- **→**

#### `editor.whereHint` ⚠️

> "balda" y "trastero" son muy de España. Alternativa neutra: "un estante, una habitación, una caja guardada".

- **EN** a shelf, a room, a box in the attic
- **ES** una balda, una habitación, una caja en el trastero
- **→** un estante, una habitación, una caja

#### `editor.notes`

- **EN** Notes
- **ES** Notas
- **→**

#### `editor.saveCorrection`

- **EN** Save correction
- **ES** Guardar la corrección
- **→**

#### `editor.addBook`

- **EN** Add the book
- **ES** Añadir el libro
- **→**

#### `editor.correctable`

- **EN** Correctable fields: {fields}. Anything else is derived from the sources.
- **ES** Campos corregibles: {fields}. Todo lo demás se deduce de las fuentes.
- **→**

#### `editor.needTitle`

- **EN** A title is the one thing a book cannot go in without.
- **ES** El título es lo único sin lo que un libro no puede entrar.
- **→**

#### `editor.badDate`

- **EN** Write the date as YYYY-MM-DD, or leave it blank.
- **ES** Escribe la fecha como AAAA-MM-DD, o déjala en blanco.
- **→**

#### `editor.badVolume`

- **EN** The volume number must be a whole number.
- **ES** El número de volumen tiene que ser un número entero.
- **→**

#### `editor.nothingChanged`

- **EN** Nothing changed, so there is nothing to correct.
- **ES** No ha cambiado nada, así que no hay nada que corregir.
- **→**

---

## Clave de IA (25)

#### `key.title`

- **EN** AI service
- **ES** Servicio de IA
- **→**

#### `key.inUse`

- **EN** key stored · in use
- **ES** clave guardada · en uso
- **→**

#### `key.switchedOff`

- **EN** key stored · switched off
- **ES** clave guardada · desactivada
- **→**

#### `key.absent`

- **EN** no key stored
- **ES** sin clave guardada
- **→**

#### `key.stored`

- **EN** key stored
- **ES** clave guardada
- **→**

#### `key.service`

- **EN** Service
- **ES** Servicio
- **→**

#### `key.model`

- **EN** Model
- **ES** Modelo
- **→**

#### `key.modelPlaceholder`

- **EN** the model name your service uses
- **ES** el nombre del modelo que use tu servicio
- **→**

#### `key.address`

- **EN** Address
- **ES** Dirección
- **→**

#### `key.addressNote`

- **EN** Anything that speaks the OpenAI chat interface — Groq, Mistral, DeepSeek, Together, or a server on your own machine. Give the address ending in /v1. A local server has to be configured to accept requests from this page before a browser may reach it.
- **ES** Cualquier cosa que hable la interfaz de chat de OpenAI: Groq, Mistral, DeepSeek, Together o un servidor en tu propia máquina. Da la dirección que termina en /v1. Un servidor local tiene que estar configurado para aceptar peticiones de esta página antes de que un navegador pueda hablar con él.
- **→**

#### `key.thisFeature`

- **EN** this
- **ES** esto
- **→**

#### `key.optional`

- **EN** Optional. Without a key, {what} still works — LibrAPP prepares everything for you to paste into an AI session yourself. With one, it can do it here.
- **ES** Opcional. Sin clave, {what} sigue funcionando: LibrAPP te lo prepara todo para que lo pegues tú en una sesión de IA. Con clave, puede hacerlo aquí mismo.
- **→**

#### `key.whereToGet`

- **EN** Where to get a key
- **ES** Dónde conseguir una clave
- **→**

#### `key.fieldLabel`

- **EN** API key for {service}
- **ES** Clave de API para {service}
- **→**

#### `key.save`

- **EN** Save key
- **ES** Guardar la clave
- **→**

#### `key.pasteFirst`

- **EN** Paste a key first.
- **ES** Pega antes una clave.
- **→**

#### `key.wrongShape`

- **EN** That does not look like a key for {service}, whose keys usually look like {hint}. If you are sure it is right, press again to save it — a service can change the shape of its keys at any time.
- **ES** Eso no parece una clave de {service}, cuyas claves suelen parecerse a {hint}. Si estás seguro de que es correcta, pulsa otra vez para guardarla: un servicio puede cambiar la forma de sus claves en cualquier momento.
- **→**

#### `key.privacy`

- **EN** Kept in this browser’s storage on this device, sent only to {where}, and never written into your catalog or an export. Anything running on this page could read it, so use a key scoped to its own project or workspace, with a spend limit.
- **ES** Se guarda en el almacenamiento de este navegador, en este dispositivo; se envía solo a {where} y nunca se escribe en tu catálogo ni en una exportación. Cualquier cosa que se ejecute en esta página podría leerla, así que usa una clave limitada a su propio proyecto o espacio, con un límite de gasto.
- **→**

#### `key.activeNote`

- **EN** — LibrAPP may send requests to {where} to read spines and answer questions.
- **ES** — LibrAPP puede enviar peticiones a {where} para leer lomos y responder preguntas.
- **→**

#### `key.offNote`

- **EN** — stored, but LibrAPP will not use it. The copy-and-paste route still works.
- **ES** — guardada, pero LibrAPP no la usará. La vía de copiar y pegar sigue funcionando.
- **→**

#### `key.switchOn`

- **EN** Switch on
- **ES** Activar
- **→**

#### `key.switchOff`

- **EN** Switch off
- **ES** Desactivar
- **→**

#### `key.delete`

- **EN** Delete
- **ES** Borrar
- **→**

#### `key.storedNote`

- **EN** Switching off keeps the key for later without letting the app spend anything. Deleting removes it from this device. Each service keeps its own key, so switching between them costs nothing.
- **ES** Desactivarla la conserva para más adelante sin dejar que la app gaste nada. Borrarla la quita de este dispositivo. Cada servicio guarda su propia clave, así que cambiar de uno a otro no cuesta nada.
- **→**

#### `key.saveAnyway`

- **EN** Save it anyway
- **ES** Guardarla de todos modos
- **→**

---

## Gráfico de géneros (5)

#### `pie.noGenres`

- **EN** No genres recorded yet.
- **ES** Todavía no hay géneros anotados.
- **→**

#### `pie.other` ⚠️

> Aparece como etiqueta de un sector del gráfico: ¿"otros" u "otras"?

- **EN** other
- **ES** otros
- **→**

#### `pie.more`

- **EN** {n} more
- **ES** {n} más
- **→**

#### `pie.note`

- **EN** The {named} largest genres cover {share}% of tagged books. The other {rest} labels are each too small to chart
- **ES** Los {named} géneros mayores cubren el {share}% de los libros con etiqueta. Las otras {rest} etiquetas son, cada una, demasiado pequeñas para el gráfico
- **→**

#### `pie.fragmented`

- **EN** genre tags come from your sources and are not a controlled list, so they fragment
- **ES** las etiquetas de género vienen de tus fuentes y no son una lista cerrada, así que se dispersan
- **→**

---

## Pie de página (6)

#### `foot.about`

- **EN** About
- **ES** Acerca de
- **→**

#### `foot.privacy`

- **EN** Privacy
- **ES** Privacidad
- **→**

#### `foot.licence`

- **EN** Licence
- **ES** Licencia
- **→**

#### `foot.source`

- **EN** Source code
- **ES** Código fuente
- **→**

#### `foot.report`

- **EN** Report a problem
- **ES** Informar de un problema
- **→**

#### `foot.ai`

- **EN** AI use
- **ES** Uso de IA
- **→**

---

## Acerca de (41)

#### `about.title`

- **EN** About this app, and who wrote it.
- **ES** Sobre esta app y sobre quién la escribió.
- **→**

#### `about.back`

- **EN** Back
- **ES** Volver
- **→**

#### `about.what`

- **EN** What LibrAPP is
- **ES** Qué es LibrAPP
- **→**

#### `about.whatBody`

- **EN** A book catalog you build from what you already have: a photograph of a shelf, a spreadsheet you keep, an export from a store, or all three at once. The same book arriving from several places becomes one entry rather than three.
- **ES** Un catálogo de libros que construyes con lo que ya tienes: una foto de una estantería, una hoja de cálculo tuya, el extracto de una tienda, o las tres cosas a la vez. El mismo libro que llega por varias vías acaba siendo una entrada y no tres.
- **→**

#### `about.whatBody2`

- **EN** It is not a social network, a reading tracker or a shop. Nobody else can see your shelves, and there is nobody to see them: LibrAPP has no server. Two steps can use an AI service if you give it a key — reading spines off a photograph, and answering questions about your collection — and both work without one.
- **ES** No es una red social, ni un registro de lecturas, ni una tienda. Nadie más puede ver tus estanterías, y no hay nadie que pudiera verlas: LibrAPP no tiene servidor. Dos pasos pueden usar un servicio de IA si le das una clave — leer los lomos de una foto y responder preguntas sobre tu colección — y los dos funcionan también sin ella.
- **→**

#### `about.who`

- **EN** Who wrote it
- **ES** Quién la escribió
- **→**

#### `about.whoBody`

- **EN** LibrAPP is written by Jesús J. Ballesteros, and it started as a way to catalog his own shelves. You are being asked to photograph your books and, if you want the AI parts, to paste a key into this page — so it seems fair to say plainly whose work this is and where to check it.
- **ES** LibrAPP la escribe Jesús J. Ballesteros, y nació como una forma de catalogar sus propias estanterías. Se te está pidiendo que fotografíes tus libros y, si quieres las funciones con IA, que pegues una clave en esta página; parece justo decir claramente de quién es este trabajo y dónde comprobarlo.
- **→**

#### `about.cv`

- **EN** His site and CV
- **ES** Su web y su CV
- **→**

#### `about.github`

- **EN** His GitHub
- **ES** Su GitHub
- **→**

#### `about.repo`

- **EN** This project on GitHub
- **ES** Este proyecto en GitHub
- **→**

#### `about.noWarranty`

- **EN** This is a personal project given away for free. It comes with no warranty and no promise of support, and it may change or stop being updated. Keep an export of anything you would mind losing.
- **ES** Esto es un proyecto personal que se regala. No lleva garantía ni promesa de soporte, y puede cambiar o dejar de actualizarse. Guarda una exportación de todo lo que te importaría perder.
- **→** Esto es un proyecto personal que se ofrece de manera gratuíta. No lleva garantía ni promesa de soporte, y puede cambiar o dejar de actualizarse. Guarda una exportación de todo lo que te importaría perder.

#### `about.privacy`

- **EN** Privacy
- **ES** Privacidad
- **→**

#### `about.privacyBody`

- **EN** Short, because there is little to say. LibrAPP is a page that runs entirely in your browser, and this is the whole of it:
- **ES** Breve, porque hay poco que contar. LibrAPP es una página que se ejecuta entera en tu navegador, y esto es todo:
- **→**

#### `about.privacy.account`

- **EN** No account, no sign-up, no profile. There is nothing to log in to.
- **ES** Sin cuenta, sin registro, sin perfil. No hay dónde iniciar sesión.
- **→**

#### `about.privacy.device`

- **EN** Your catalog is written to this device — a folder you chose, or storage the browser keeps for this app. It is never uploaded.
- **ES** Tu catálogo se escribe en este dispositivo: una carpeta que elijas o el almacenamiento que el navegador guarda para esta app. Nunca se sube a ninguna parte.
- **→**

#### `about.privacy.key`

- **EN** If you provide an AI key, it stays in this browser and is sent only to the service you chose. It is never written into your catalog and never included in an export. Photographs are cut into tiles here; only the tiles go, and only when you ask.
- **ES** Si das una clave de IA, se queda en este navegador y solo se envía al servicio que hayas elegido. Nunca se escribe en tu catálogo ni se incluye en una exportación. Las fotos se cortan en piezas aquí mismo; solo salen las piezas, y solo cuando tú lo pides.
- **→**

#### `about.privacy.cookies`

- **EN** No cookies, no analytics, no trackers, no third-party requests. The only thing remembered about you is which language you picked and where your library is.
- **ES** Sin cookies, sin analítica, sin rastreadores, sin peticiones a terceros. Lo único que se recuerda de ti es qué idioma elegiste y dónde está tu biblioteca.
- **→**

#### `about.privacy.offline`

- **EN** Once loaded it runs with no network at all, which is the simplest proof that nothing is being sent anywhere.
- **ES** Una vez cargada funciona sin ninguna conexión, que es la prueba más sencilla de que no se está enviando nada a ninguna parte.
- **→**

#### `about.privacyCheck`

- **EN** You do not have to take any of that on trust — the code is public.
- **ES** No hace falta que te fies de nada de esto: el código es público.
- **→**

#### `about.readSource`

- **EN** Read it
- **ES** Léelo
- **→**

#### `about.licence`

- **EN** Licence
- **ES** Licencia
- **→**

#### `about.licenceBody`

- **EN** LibrAPP is free to use, read, modify and share for anything that is not commercial. Selling it, or building a paid service on it, needs permission first. The full terms:
- **ES** LibrAPP se puede usar, leer, modificar y compartir libremente para cualquier fin que no sea comercial. Venderla, o montar sobre ella un servicio de pago, requiere permiso previo. Los términos completos:
- **→**

#### `about.licenceName`

- **EN** PolyForm Noncommercial 1.0.0
- **ES** PolyForm Noncommercial 1.0.0
- **→**

#### `about.attributions`

- **EN** Built with
- **ES** Construida con
- **→**

#### `about.attributionsBody`

- **EN** These are other people’s work, included in the app and used under their own terms:
- **ES** Esto es trabajo de otras personas, incluido en la app y usado según sus propios términos:
- **→**

#### `about.contact`

- **EN** Getting in touch
- **ES** Cómo contactar
- **→**

#### `about.contactBody`

- **EN** There is no contact form, because there is no server to receive one. Anything about the app itself — a bug, something confusing, an idea — belongs on GitHub, where it is public and does not get lost. Anything else can go through the contact details on my own site.
- **ES** No hay formulario de contacto, porque no hay servidor que lo reciba. Todo lo que tenga que ver con la app — un fallo, algo confuso, una idea — va en GitHub, donde queda público y no se pierde. Lo demás puede ir por los datos de contacto de mi propia web.
- **→**

#### `about.reportProblem`

- **EN** Report a problem
- **ES** Informar de un problema
- **→**

#### `about.contactMe`

- **EN** Contact me
- **ES** Contactar conmigo
- **→**

#### `about.version`

- **EN** Version {build}
- **ES** Versión {build}
- **→**

#### `about.updateNote`

- **EN** the Library tab can force a fresh copy if this looks out of date
- **ES** la pestaña Biblioteca puede forzar una copia nueva si esto parece anticuado
- **→**

#### `about.ai`

- **EN** AI, and how this was built
- **ES** La IA, y cómo se construyó esto
- **→**

#### `about.aiBody`

- **EN** LibrAPP was written by one person working with an AI assistant, over a series of sessions. Most of the code was typed by the model. Every decision about what to build was the person’s. Saying which is which seems better than leaving it to be guessed:
- **ES** LibrAPP la ha escrito una persona trabajando con un asistente de IA, a lo largo de varias sesiones. La mayor parte del código lo tecleó el modelo. Todas las decisiones sobre qué construir fueron de la persona. Parece mejor decir qué es cada cosa que dejarlo a la imaginación:
- **→**

#### `about.ai.author`

- **EN** Jesús J. Ballesteros
- **ES** Jesús J. Ballesteros
- **→**

#### `about.ai.author.did`

- **EN** conceived the app and decided every step of it — what to build next, which of the proposed approaches to take, what to leave out, and when to stop. He supplied everything it was tested against: his own shelves, his own exports, his own devices. He reviewed the results, and corrected them.
- **ES** concibió la app y decidió cada paso: qué construir a continuación, cuál de los caminos propuestos tomar, qué dejar fuera y cuándo parar. Puso todo aquello con lo que se probó: sus propias estanterías, sus propios extractos, sus propios dispositivos. Revisó los resultados y los corrigió.
- **→**

#### `about.ai.assistant`

- **EN** Claude, an AI assistant
- **ES** Claude, un asistente de IA
- **→**

#### `about.ai.assistant.did`

- **EN** proposed approaches when asked and occasionally when not, wrote the code and the documentation, and carried out the changes he decided on.
- **ES** propuso enfoques cuando se le pedía y alguna vez sin que se le pidiera, escribió el código y la documentación, y llevó a cabo los cambios que él decidía.
- **→**

#### `about.ai.testers`

- **EN** A few early testers
- **ES** Unos primeros probadores
- **→**

#### `about.ai.testers.did`

- **EN** used it and said what did not work. More than one thing here exists because of that.
- **ES** la usaron y dijeron qué no funcionaba. Más de una cosa de aquí existe por eso.
- **→**

#### `about.aiReview`

- **EN** The review was not a formality. The assistant got things wrong — it once reported that a cut-off title had been repaired when it had not, and it chose a way of splitting photographs that fell apart on a close-up of three books. Both were caught by someone checking the output against the actual shelf. That experience is why this app shows you what a model read and waits for you to approve it, rather than importing it quietly.
- **ES** La revisión no fue un trámite. El asistente se equivocó: una vez dio por reparado un título cortado que seguía cortado, y eligió una forma de partir las fotos que se deshacía con un primer plano de tres libros. Las dos cosas las detectó alguien contrastando el resultado con la estantería real. Esa experiencia es la razón de que esta app te enseñe lo que ha leído un modelo y espere a que lo apruebes, en vez de importarlo sin decir nada.
- **→**

#### `about.aiNotYourBooks`

- **EN** All of that is about how the program was written. It has nothing to do with the contents of your catalog: no entry is invented, every book comes from a source you provided, and the AI features inside the app are optional, off until you add a key, and always show you the result before anything is kept.
- **ES** Todo eso va de cómo se escribió el programa. No tiene nada que ver con el contenido de tu catálogo: no se inventa ninguna entrada, cada libro viene de una fuente que tú has dado, y las funciones de IA dentro de la app son opcionales, están apagadas hasta que añades una clave, y siempre te enseñan el resultado antes de guardar nada.
- **→**

---

## Versión (5)

#### `version.title`

- **EN** Version
- **ES** Versión
- **→**

#### `version.built`

- **EN** Built {when}.
- **ES** Compilada el {when}.
- **→**

#### `version.body`

- **EN** LibrAPP keeps a copy of itself on this device so it opens without a network. That copy usually replaces itself on the next visit. If it seems stuck on an older version, throw it away and fetch the current one.
- **ES** LibrAPP guarda una copia de sí misma en este dispositivo para poder abrirse sin conexión. Esa copia suele reemplazarse sola en la siguiente visita. Si parece atascada en una versión antigua, tírala y trae la actual.
- **→**

#### `version.refresh`

- **EN** Fetch a fresh copy
- **ES** Traer una copia nueva
- **→**

#### `version.safe`

- **EN** This discards only the app. Your library, your sources and your corrections are not stored here and are not touched.
- **ES** Esto descarta solo la app. Tu biblioteca, tus fuentes y tus correcciones no se guardan aquí y no se tocan.
- **→**

---

## Varios (1)

#### `app.strapline`

- **EN** your shelf, catalogued
- **ES** tu estantería, catalogada
- **→**

---
