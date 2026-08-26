// English strings. This file is the reference: every other language falls back
// to it key by key, so a missing translation shows English rather than a blank.
//
// Keys are grouped by where they appear. `{name}` placeholders are filled at
// render time.

export default {
  // -- landing ------------------------------------------------------------
  'landing.tagline': 'Your full library catalog and your own personal librarian, at hand.',
  'landing.intro':
    'Photograph a shelf and LibrAPP reads the spines into a catalog you can search, filter and browse. You can also bring in a spreadsheet, a store export, or a catalog you built on another device — and combine them all without duplicates.',
  'landing.privacy.title': 'Your books stay with you',
  'landing.privacy.body':
    'There is no account and no server. Your catalog is written to this device and nothing is uploaded. LibrAPP works with no connection at all once it has loaded.',
  'landing.needs.title': 'What it needs to work',
  'landing.needs.storage':
    'Somewhere to keep your catalog — a folder you pick, or storage the browser manages for you. You choose, and you can change your mind later.',
  'landing.needs.source':
    'At least one source of books: a photograph, a list you already keep, or a catalog exported from another device.',
  'landing.needs.ai':
    'An AI service, for two of the steps: reading the spines off a photograph, and asking the desk about your books. Both work without a key, by preparing the request for you to paste into any AI session yourself. Everything else runs here with no AI at all.',
  'landing.start': 'Where would you like to start?',
  'landing.start.hint': 'Any of these will set up your storage if you have not chosen it yet.',

  'landing.option.storage': 'I want to choose where my catalog is kept',
  'landing.option.storage.hint': 'Set this up first, before adding any books.',
  'landing.option.photo': 'I have a picture of my shelf',
  'landing.option.photo.hint': 'The quickest way to catalog books you own on paper.',
  'landing.option.list': 'I have a list of the books I own',
  'landing.option.list.hint': 'A spreadsheet, a CSV, an XML file, or a store export as PDF.',
  'landing.option.import': 'I have a catalog from another device',
  'landing.option.import.hint': 'Bring in a file you exported from LibrAPP elsewhere.',
  'landing.option.browse': 'I want to see my catalog',
  'landing.option.browse.hint': 'Go straight to the books you already have here.',
  'landing.option.browse.empty': 'There is nothing here yet — start with one of the options above.',

  'landing.language': 'Language',
  'landing.learnMore': 'More about LibrAPP',
  'landing.browserWarning':
    'This browser is missing something LibrAPP needs. Open the Library tab once you are in for the details.',

  // -- shell --------------------------------------------------------------
  // -- the LibrAPPrian ------------------------------------------------------
  'librarian.name': 'The LibrAPPrian',
  'librarian.open': 'What the LibrAPPrian has to say',
  'librarian.close': 'Put the LibrAPPrian away',
  'librarian.dismiss': 'Not again',
  'librarian.dismissWhy': 'Hide the LibrAPPrian on every page from now on',

  'librarian.empty': 'Nothing on the shelves yet. A photograph of one is the quickest way to start.',
  'librarian.welcome': 'Welcome back. {n} {n:book|books} {n:is|are} catalogued and waiting.',
  'librarian.unread': '{n} {n:book|books} here {n:is|are} still unopened.',
  'librarian.allRead': 'Every book here is marked read. That is not a common sight.',
  'librarian.unrecorded': '{n} {n:book|books} here {n:has|have} no read state recorded.',
  'librarian.lentLong': '{n} {n:book|books} {n:has|have} been with someone else for more than a year.',
  'librarian.borrowedLong': '{n} {n:book|books} here {n:belongs|belong} to somebody else, and {n:has|have} for more than a year.',
  'librarian.desk': 'Ask about your own shelves. All {n} {n:book|books} here {n:is|are} in the catalog.',
  'librarian.shelf': 'Photograph the shelf straight on and at full size, and every visible spine can be read.',
  'librarian.list': 'A spreadsheet does nicely. It merges with what is already here, without duplicates.',
  'librarian.storage': 'The catalog lives where it was put. An export kept somewhere else is worth having.',

  'librarian.reading': '{n} {n:tile|tiles}, spines top to bottom. This takes a moment.',
  'librarian.asking': 'Looking through the shelves.',
  'librarian.imported': '{n} {n:book|books} arrived, and {known} {known:was|were} already here. One entry each.',

  'librarian.action.startPhoto': 'Start with a photograph',
  'librarian.action.showOldest': 'Show the oldest of them',
  'librarian.action.showLent': 'Show what is out',
  'librarian.action.showBorrowed': 'Show what is owed back',
  'librarian.action.showUnrecorded': 'Show them',

  'app.strapline': 'your shelf, catalogued',
  'nav.home': 'Start',
  'nav.catalog': 'Catalog',
  'nav.shelf': 'Shelf picture',
  'nav.list': 'Upload list',
  'nav.desk': "LibrAPPrian's desk",
  'nav.library': 'Library',
  'nav.home.hint': 'the welcome page',
  'nav.catalog.hint': 'everything you own',
  'nav.shelf.hint': 'read a photograph',
  'nav.list.hint': 'a file you already keep',
  'nav.desk.hint': 'ask about it',
  'nav.library.hint': 'where it lives',

  'sidebar.books': 'books',
  'sidebar.authors': 'authors',
  'sidebar.read': 'read',
  'sidebar.unread': 'unread',
  'sidebar.notRecorded': 'not recorded',
  'sidebar.noCatalog': 'No catalog yet.',
  'sidebar.rebuild': 'Rebuild catalog',
  'sidebar.working': 'working…',

  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.dismiss': 'Dismiss',
  'common.edit': 'Edit',
  'common.remove': 'Remove',
  'common.restore': 'Restore',
  'common.undo': 'Undo',
  'common.import': 'Import',
  'common.export': 'Export',
  'common.opening': 'Opening your library…',
  'common.saving': 'saving…',
  'common.importing': 'importing…',

  // -- storage choice -----------------------------------------------------
  'setup.title': 'Where should your catalog be kept?',
  'setup.intro':
    'LibrAPP keeps your catalog on this device and sends it nowhere. It only needs to know where to put it.',
  'setup.folder.title': 'A folder you choose',
  'setup.folder.body':
    'Plain files you can open, back up, or keep anywhere you like. LibrAPP writes your sources and catalog there and nothing else.',
  'setup.folder.action': 'Choose a folder',
  'setup.browser.title': 'Storage the browser manages',
  'setup.browser.body':
    'Nothing to choose and nothing to configure, but the files are not visible to other apps — an export is how a copy leaves this device.',
  'setup.browser.action': 'Use browser storage',
  'setup.noPicker':
    'This browser has no folder picker — on a phone that is normal. Browser storage below works the same from inside the app.',
  'setup.either': 'Either can be changed later, and a catalog can be moved from one to the other.',

  'permit.title': 'Reopen your catalog',
  'permit.body':
    'The browser needs you to confirm access to the folder again. It asks once per session, and there is nothing LibrAPP can do to skip it.',
  'permit.open': 'Open the folder',
  'permit.elsewhere': 'Choose somewhere else',

  // -- errors -------------------------------------------------------------
  'error.noKeyActive': 'No key is switched on.',
  'error.notAnExport':
    '{name} is not a LibrAPP export. Choose the file you exported from Library → Export on the other device.',
  'error.notJson': '{name} is not readable as JSON. It may have been renamed, or downloaded only in part.',

  // -- a book ---------------------------------------------------------------
  'read.read': 'read',
  'read.unread': 'unread',
  'read.unknown': 'not recorded',

  'book.series': 'Series',
  'book.volume': 'vol.',
  'book.formats': 'Formats',
  'book.read': 'Read',
  'book.acquired': 'Acquired',
  'book.publisher': 'Publisher',
  'book.genre': 'Genre',
  'book.where': 'Where',
  'book.collections': 'Collections',
  'book.devices': 'Devices',
  'book.sources': 'Sources',
  'book.tags': 'Tags',
  'book.worthKnowing': 'Worth knowing',
  'book.confidence': 'Confidence',
  'book.confShort': 'conf. {level}',
  'book.authorUnknown': 'Author not recorded',
  'book.notedWhenRead': 'Your note',
  'book.favourite': 'A favourite',
  'book.unknownNote':
    'Nothing has ever recorded whether this was read. That is not the same as unread, so it is left blank rather than guessed.',
  'book.corrected': 'Corrected by hand.',
  'book.correctedOn': 'Corrected by hand on {date}.',
  'book.correctedFields': '{fields} - overriding what the sources say.',
  'book.wasUnset': 'not recorded',
  'book.before': 'Before:',
  'book.undoCorrection': 'Undo this correction',

  'flag.title_clipped': 'the title is cut off - no source had it whole',
  'flag.illegible_spine': 'the spine could not be read properly',
  'flag.no_personal_author': 'no named author: a reference work, anthology or anonymous text',
  'flag.no_genre': 'no genre recorded yet',
  'flag.placeholder': 'a stand-in, not a real title - re-photograph this one',
  'flag.series_not_expanded': 'stands for several volumes no source lists individually',
  'flag.corrected': 'you corrected this entry by hand',

  'confidence.high': 'high',
  'confidence.medium': 'medium',
  'confidence.low': 'low',
  'confidence.high.why': 'from a machine-readable source, checked against its own count',
  'confidence.medium.why': 'transcribed by eye or by model',
  'confidence.low.why': 'a guess',

  // -- upload list ----------------------------------------------------------
  'format.physical': 'physical',
  'format.ebook': 'ebook',
  'format.audio': 'audio',

  'list.intro':
    'A spreadsheet, a CSV, an XML catalog, or a store export as PDF. Columns are matched by name in several languages, so a sheet headed Autor / Título / Género works as well as author / title / genre. Everything is read on this device.',
  'list.drop': 'Drop a list',
  'list.reading': 'Reading it…',
  'list.whatIsIn': 'What is in {name}?',
  'list.manyLists':
    'This file holds more than one list. Pick the one you actually own — importing a wishlist as your library is the mistake worth one extra question.',
  'list.whichList': 'Which list',
  'list.callIt': 'Call it',
  'list.theseAre': 'These are',
  'list.trust': 'Trust',
  'list.importAction': 'Import and rebuild',
  'list.theseAreNote': 'is only a fallback: rows naming their own format keep it.',
  'list.trustNote':
    'decides who wins when two sources disagree about the same book — a verified export outranks a hand-kept list.',
  'list.imported': '{n} records imported.',
  'list.nowHolds': 'The catalog now holds {n} books.',
  'list.declared':
    'The export declares {declared} items and {read} were read — a difference of {difference}.',

  // -- catalog --------------------------------------------------------------
  'catalog.empty.title': 'No catalog yet',
  'catalog.empty.body':
    'Nothing has been ingested. Start with a photograph of a shelf, or with a list you already keep — either one on its own is enough to build a catalog.',
  'catalog.empty.shelf': 'Read a shelf photograph',
  'catalog.empty.list': 'Upload a list',
  'catalog.typeIn': 'Type a book in',
  'catalog.countOne': '{total} book',
  'catalog.countAll': '{total} books',
  'catalog.countSome': '{shown} of {total} books',
  'catalog.builtAt': 'built {when}',
  'catalog.correctedCount': '{n} corrected',
  'catalog.removedCount': '{n} removed',
  'catalog.searchPlaceholder': 'Search titles, authors, series, tags…',
  'catalog.searchLabel': 'Search the catalog',
  'catalog.clearSearch': 'Clear search',
  'catalog.groupBy': 'Group by',
  'catalog.group.title': 'Title',
  'catalog.group.author': 'Author',
  'catalog.group.series': 'Series',
  'catalog.any': 'any',
  'catalog.format': 'Format',
  'catalog.source': 'Source',
  'catalog.sort': 'Sort',
  'catalog.sort.title': 'title',
  'catalog.sort.author': 'author',
  'catalog.sort.newest': 'newest first',
  'catalog.sort.oldest': 'oldest first',
  'catalog.noMatch': 'Nothing matches.',
  'catalog.clearFilters': 'Clear the filters',
  'catalog.standalone': 'Standalone',

  // -- library --------------------------------------------------------------
  'storage.intro':
    'Where your catalog lives, what it was built from, and how to move it to another device.',
  'storage.owlHidden': 'The LibrAPPrian is hidden on every page. Bringing it back shows the badge in the corner again.',
  'storage.owlRestore': 'Bring it back',
  'storage.owlBack': 'The LibrAPPrian is back.',
  'storage.eyebrow': 'The stacks',
  'storage.kindUnknown': 'not recorded',
  'storage.where': 'Storage',
  'storage.kind.folder': 'a folder you chose — plain files you can open, back up or commit',
  'storage.kind.browser': 'browser storage — private to LibrAPP, and only leaves by export',
  'storage.kind.unknown': 'unknown',
  'storage.using': 'Using {used} of about {quota} the browser allows this app.',
  'storage.notPersistent': 'This storage is not marked persistent.',
  'storage.notPersistentBody':
    'The browser may clear it if the device runs short of space, and your library would go with it. Installing LibrAPP usually earns persistence; until then, keep an export.',
  'storage.askPersistent': 'Ask for persistent storage',
  'storage.persistent': 'Marked persistent — the browser will not clear it to reclaim space.',
  'storage.elsewhere': 'Use a different location',
  'storage.forgetNote': 'This forgets where the library is; it does not delete anything.',

  'storage.sources': 'Sources',
  'storage.noSources': 'Nothing ingested yet.',
  'storage.col.name': 'name',
  'storage.col.kind': 'kind',
  'storage.col.from': 'from',
  'storage.col.trust': 'trust',
  'storage.col.records': 'records',
  'storage.sourcesNote':
    'Every source stays as its ingester wrote it. Rebuilding merges all of them, so removing one and rebuilding is how an import is undone.',
  'storage.sourceRemoved': 'Removed {name}.',

  'storage.browser': 'Your browser',
  'storage.browserNote':
    'Checked by trying each feature, not by reading the browser name — so this is what your browser can actually do, whichever one it is.',
  'storage.allSupported': 'everything supported',
  'storage.someMissing': '{n} feature(s) unavailable',
  'storage.notSupported': 'not supported',
  'storage.yes': 'yes',
  'storage.no': 'no',
  'storage.missing': 'missing',
  'storage.cannotRun':
    'LibrAPP cannot run properly in this browser. Try a current version of Chrome, Edge, Brave, Firefox or Safari.',

  'cap.secure.label': 'Secure page (HTTPS or localhost)',
  'cap.secure.needed': 'everything below',
  'cap.secure.fix': 'Open LibrAPP over https://, not http://.',
  'cap.indexeddb.label': 'IndexedDB',
  'cap.indexeddb.needed': 'remembering your settings and where your library is',
  'cap.indexeddb.fix': 'Private or incognito windows sometimes disable this.',
  'cap.opfs.label': 'Private file storage',
  'cap.opfs.needed': 'keeping your library inside the browser',
  'cap.opfs.fix': 'Without it LibrAPP has nowhere to keep a catalog.',
  'cap.regex.label': 'Modern regular expressions',
  'cap.regex.needed': 'matching titles and author names',
  'cap.regex.fix': 'Needs Safari 16.4 or later, or any current browser.',
  'cap.folder.label': 'Folder access',
  'cap.folder.needed': 'saving your library to a folder you choose',
  'cap.folder.fix':
    'Only Chrome and Edge on a desktop offer this. Everywhere else LibrAPP uses its own storage, which works the same but is not visible to other programs.',
  'cap.unzip.label': 'Decompression',
  'cap.unzip.needed': 'reading .xlsx spreadsheets',
  'cap.unzip.fix': 'CSV, XML and PDF imports still work. Needs Firefox 113 or Safari 16.4 and later.',
  'cap.canvas.label': 'Offscreen canvas',
  'cap.canvas.needed': 'cutting a photograph into readable tiles',
  'cap.canvas.fix': 'Without it, import your books from a list instead of a photograph.',
  'cap.bitmap.label': 'Image decoding',
  'cap.bitmap.needed': 'opening the photograph you choose',
  'cap.bitmap.fix': 'Without it, import your books from a list instead of a photograph.',
  'cap.sw.label': 'Service workers',
  'cap.sw.needed': 'installing LibrAPP and using it offline',
  'cap.sw.fix': 'LibrAPP still runs, but only while you have a connection.',

  'storage.corrections': 'Corrections you have made',
  'storage.correctionsNote':
    'Kept apart from your sources and applied after every rebuild. Removing a book cannot delete it — the next rebuild reads the same sources and would put it back — so a removal is recorded here instead, and can be undone.',
  'storage.noCorrections': 'Nothing corrected yet.',
  'storage.removedGroup': 'Removed ({n})',
  'storage.editedGroup': 'Edited ({n})',
  'storage.changed': 'changed {fields}',
  'storage.orphaned': '{n} correction(s) no longer match any book.',
  'storage.orphanedNote':
    'An entry is identified by its author and title, so this happens when a better source supplies a fuller title and the identity changes. They are listed rather than dropped, because silence would look like the correction had stopped mattering.',
  'storage.wasRemoved': 'was removed',
  'storage.wasEdited': 'was edited',
  'storage.forgetIt': 'Forget it',
  'storage.undone': 'Correction to {what} undone.',
  'storage.restored': '{what} restored.',

  'storage.move': 'Move this library elsewhere',
  'storage.moveNote':
    'An export holds the sources, not the catalog. The catalog is rebuilt from them on the other side, so the two copies cannot drift into disagreeing about which is current.',
  'storage.exported': 'Exported {n} source(s).',
  'storage.importTitle': 'Import an export',
  'storage.importHint': 'choose the .json file you exported — it is added, then rebuilt',
  'storage.imported': 'Imported {n} source(s) and rebuilt.',

  // -- shelf picture --------------------------------------------------------
  'common.copied': 'Copied',
  'common.save': 'Save',

  'shelf.intro':
    'Photograph a shelf straight on, at your camera’s full resolution. This matters more than anything else here: a whole bookcase at one megapixel is unreadable, and the same shelf at fifty is not.',
  'shelf.whatItIsFor': 'reading a shelf',
  'shelf.eyebrow': 'Accessions',
  'list.listsFound': '{n} lists found',
  'list.eyebrow': 'Accessions',
  'shelf.stepOne': 'Step one · The photograph',
  'shelf.stepTwo': 'Step two · Read the spines',
  'shelf.stepThree': 'Step three · Check what it read',
  'shelf.step1': '1 · The photograph',
  'shelf.dropPhoto': 'Take or choose a photograph',
  'shelf.dropPhotoHint': 'JPEG or PNG · nothing is uploaded',
  'shelf.cutting': 'Cutting it into tiles…',
  'shelf.step2': '2 · Read the spines',
  'shelf.tileCount': '{n} tile(s)',
  'shelf.tilesNote':
    'Tiles are cut at native resolution and overlap, so a book on a seam is whole in one of them. Give them to a model along with the instructions below, and have it write the transcription.',
  'shelf.grid': 'Grid · {cols} across × {rows} down',
  'shelf.lessAcross': '− across',
  'shelf.moreAcross': '+ across',
  'shelf.lessDown': '− down',
  'shelf.moreDown': '+ down',
  'shelf.gridNote':
    'Aim for tiles holding a handful of whole spines, with the title readable top to bottom. No setting suits every shelf: a wide bookcase wants several tiles across, and a close-up of three books wants one and nothing more.',
  'shelf.gridWarning': 'Adding rows is what splits a title in half',
  'shelf.gridWarningTail':
    ', so add those only when the photograph really shows shelves stacked above one another.',
  'shelf.backToSuggested': 'back to the suggested {cols}×{rows}',
  'shelf.reading': 'reading the spines…',
  'shelf.readForMe': 'Read these tiles for me',
  'shelf.tokensOnly': 'about {k}k tokens in, at your own rate',
  'shelf.youApprove': 'you approve the result before anything is imported',
  'shelf.copyInstructions': 'Copy the instructions',
  'shelf.hideThem': 'Hide them',
  'shelf.readThem': 'Read them',
  'shelf.saveAll': 'Save all tiles',
  'shelf.tileAlt': 'Tile row {row}, column {column}',
  'shelf.step3': '3 · Check what it read',
  'shelf.bookCount': '{n} book(s)',
  'shelf.cost': 'cost {amount}',
  'shelf.checkNote':
    'Nothing has been imported yet. A model reading a spine can be wrong in a way the catalog cannot detect later, so this is the moment to look. Anything marked uncertain is worth checking against the tiles above.',
  'shelf.unplaced': 'unplaced',
  'shelf.importThese': 'Import these {n} books',
  'shelf.discard': 'Discard',
  'shelf.stepBring': '{n} · Bring a transcription back yourself',
  'shelf.bringNote':
    'The route that needs no key: read the tiles in any AI session with the instructions above, and drop the JSON here. The import refuses a file with an untitled book or an unknown confidence value — a bad read should stop here rather than turn up in your catalog later.',
  'shelf.dropTranscription': 'Drop the transcription',
  'shelf.dropTranscriptionHint': 'the JSON file the model wrote',
  'shelf.result': '{n} books read from the photograph.',
  'shelf.uncertain': '{n} spine(s) uncertain',
  'shelf.resultNote':
    'A photograph cannot see a purchase date or whether you read something, so those stay unknown until another source says.',

  // -- the desk -------------------------------------------------------------
  'desk.nothingYet': 'Nothing to work with yet — build a catalog first.',
  'desk.intro':
    'Where the catalog stops being a list and starts being an argument. Everything on the left is computed locally. The right-hand side prepares a question for a model — your shelf is what makes the answer yours rather than generic.',
  'desk.neverOpened': 'Bought, and never opened',
  'desk.waitingAtLeast': 'waiting at least',
  'desk.year': '{n} year',
  'desk.years': '{n} years',
  'desk.yearsShort': '{n} yr',
  'desk.neverOpenedNote':
    'Ordered by how long they have waited, weighted by how much you evidently wanted them at the time. Only books known to be unread appear — {unknown} books have no reading record at all, and guessing would bury this list under books you already finished.',
  'desk.nothingWaited': 'Nothing has waited that long.',
  'desk.showFive': 'Show only the first five',
  'desk.showAll': 'Show all {n}',
  'desk.madeOf': 'What the collection is made of',

  'desk.eyebrow': 'Enquiries',
  'desk.askEyebrow': 'Put a question',
  'desk.ask': 'Ask',
  'desk.whatItIsFor': 'the desk',
  'desk.synopsis': 'Synopsis',
  'desk.synopsis.placeholder': 'Which book? It does not have to be one you own.',
  'desk.synopsis.blurb':
    'Describes a book to someone whose shelf is in front of you — what it argues, what it is reacting against, and how it stands against books you already have.',
  'desk.recommend': 'Recommendation',
  'desk.recommend.placeholder':
    'Anything to steer it? “something for a long flight”, or leave blank.',
  'desk.recommend.blurb':
    'Two or three books, never more, chosen against where your reading is going rather than where it has been — and it checks the unread pile before suggesting a purchase.',
  'desk.askService': 'Ask {service}',
  'desk.askForMe': 'Ask for me',
  'desk.thinking': 'thinking…',
  'desk.copyRequest': 'Copy the whole request',
  'desk.copyProfile': 'Copy just the profile',
  'desk.copyAnswer': 'Copy the answer',
  'desk.answer': 'Answer',
  'desk.streaming': 'streaming…',
  'desk.withKey':
    'With a key, LibrAPP asks on your behalf. Without one it assembles the request for you to paste into any AI session — the same instructions, the same profile, the same question.',
  'desk.withoutKey':
    'LibrAPP assembles the instructions, your reading profile and your question into one block — paste it into any AI session you already use. Add a key below and it can ask for you instead.',
  'desk.promptsNote': 'The prompts are kept as plain text, so you can edit how it asks.',
  'desk.profile': 'Your reading profile',
  'desk.characters': '{n} characters',
  'desk.profileNote':
    'Deliberately not the whole catalog — a few hundred titles crowd out the question. This is the shape of the collection and how it has moved, with enough named books to argue from.',

  // -- typing a book in, correcting one -------------------------------------
  'editor.add': 'Add a book',
  'editor.correct': 'Correct this entry',
  'editor.addNote':
    'This becomes a record in your manual source and merges like any other. If a book you type in is already in the catalog from somewhere else, you get one entry that knows both.',
  'editor.correctNote':
    'This is recorded as a correction, kept apart from your sources and applied after every rebuild. It outranks whatever the sources say, and can be undone.',
  'editor.title': 'Title',
  'editor.authors': 'Authors',
  'editor.authorsHint': 'separate several with commas; leave blank for an anonymous work',
  'editor.volume': 'Volume',
  'editor.readHint': 'blank means nobody recorded it',
  'editor.where': 'Where it is',
  'editor.whereHint': 'a shelf, a room, a box in the attic',
  'editor.notes': 'Notes',
  'editor.notesHint': 'Personal remarks on this book. The LibrAPPrian takes them into account.',
  'editor.favourite': 'Favourite',
  'editor.favouriteOn': 'Marked as a favourite',
  'editor.favouriteOff': 'Not marked',
  'editor.saveCorrection': 'Save correction',
  'editor.addBook': 'Add the book',
  'editor.correctable': 'Correctable fields: {fields}. Anything else is derived from the sources.',
  'editor.needTitle': 'A title is the one thing a book cannot go in without.',
  'editor.badDate': 'Write the date as YYYY-MM-DD, or leave it blank.',
  'editor.badVolume': 'The volume number must be a whole number.',
  'editor.badPages': 'The page count must be a whole number.',
  'editor.pagesHint': 'A typical edition, not a count of this copy',
  'editor.nothingChanged': 'Nothing changed, so there is nothing to correct.',

  // -- the genre pie --------------------------------------------------------
  'pie.noGenres': 'No genres recorded yet.',
  'pie.other': 'other',
  'pie.more': '{n} more',
  'pie.note':
    'The {named} largest genres cover {share}% of tagged books. The other {rest} labels are each too small to chart',
  'pie.fragmented':
    'genre tags come from your sources and are not a controlled list, so they fragment',

  // -- the API key box ------------------------------------------------------
  'key.title': 'AI service',
  'key.inUse': 'key stored · in use',
  'key.switchedOff': 'key stored · switched off',
  'key.absent': 'no key stored',
  'key.stored': 'key stored',
  'key.service': 'Service',
  'key.model': 'Model',
  'key.modelPlaceholder': 'the model name your service uses',
  'key.address': 'Address',
  'key.addressNote':
    'Anything that speaks the OpenAI chat interface — Groq, Mistral, DeepSeek, Together, or a server on your own machine. Give the address ending in /v1. A local server has to be configured to accept requests from this page before a browser may reach it.',
  'key.thisFeature': 'this',
  'key.optional':
    'Optional. Without a key, {what} still works — LibrAPP prepares everything for you to paste into an AI session yourself. With one, it can do it here.',
  'key.whereToGet': 'Where to get a key',
  'key.fieldLabel': 'API key for {service}',
  'key.save': 'Save key',
  'key.pasteFirst': 'Paste a key first.',
  'key.wrongShape':
    'That does not look like a key for {service}, whose keys usually look like {hint}. If you are sure it is right, press again to save it — a service can change the shape of its keys at any time.',
  'key.privacy':
    'Kept in this browser’s storage on this device, sent only to {where}, and never written into your catalog or an export. Anything running on this page could read it, so use a key scoped to its own project or workspace, with a spend limit.',
  'key.activeNote': '— LibrAPP may send requests to {where} to read spines and answer questions.',
  'key.offNote': '— stored, but LibrAPP will not use it. The copy-and-paste route still works.',
  'key.switchOn': 'Switch on',
  'key.switchOff': 'Switch off',
  'key.delete': 'Delete',
  'key.storedNote':
    'Switching off keeps the key for later without letting the app spend anything. Deleting removes it from this device. Each service keeps its own key, so switching between them costs nothing.',

  // -- the footer, and the page behind it -----------------------------------
  'foot.about': 'About',
  'foot.privacy': 'Privacy',
  'foot.licence': 'Licence',
  'foot.source': 'Source code',
  'foot.report': 'Report a problem',

  'about.title': 'Your full library catalog and your own personal librarian, at hand.',
  'about.back': 'Back',

  'about.what': 'What LibrAPP is',
  'about.whatBody':
    'Two halves. A book catalog you build from what you already have: a photograph of a shelf, a spreadsheet you keep, an export from a store, or all three at once. The same book arriving from several places becomes one entry rather than three.',
  'about.whatBody2':
    'And a librarian who has read your shelves. The desk answers about what you own: what to read next and why, which books by an author you have collected unevenly are missing, what threads run through the collection, a list for a long flight. It is not a social network, a reading tracker or a shop. Nobody else can see your shelves, and there is nobody to see them, because LibrAPP has no server. Two steps can use an AI service if you give it a key, and both work without one.',

  'about.who': 'Who wrote it',
  'about.whoBody':
    'LibrAPP is written by Jesús J. Ballesteros, and it started as a way to catalog his own shelves.',
  'about.cv': 'His site and CV',
  'about.github': 'His GitHub',
  'about.repo': 'This project on GitHub',
  'about.noWarranty':
    'This is a personal project given away for free. It comes with no warranty and no promise of support, and it may change or stop being updated. Keep an export of anything you would mind losing.',

  'about.privacy': 'Privacy',
  'about.privacyBody':
    'Short, because there is little to say. LibrAPP is a page that runs entirely in your browser, and this is the whole of it:',
  'about.privacy.account':
    'No account, no sign-up, no profile. There is nothing to log in to.',
  'about.privacy.device':
    'Your catalog is written to this device — a folder you chose, or storage the browser keeps for this app. It is never uploaded.',
  'about.privacy.key':
    'If you provide an AI key, it stays in this browser and is sent only to the service you chose. It is never written into your catalog and never included in an export. Photographs are cut into tiles here; only the tiles go, and only when you ask.',
  'about.privacy.cookies':
    'No cookies, no analytics, no trackers, no third-party requests. The only thing remembered about you is which language you picked and where your library is.',
  'about.privacy.offline':
    'Once loaded it runs with no network at all, which is the simplest proof that nothing is being sent anywhere.',
  'about.privacyCheck': 'You do not have to take any of that on trust — the code is public.',
  'about.readSource': 'Read it',

  'about.licence': 'Licence',
  'about.licenceBody':
    'LibrAPP is free to use, read, modify and share for anything that is not commercial. Selling it, or building a paid service on it, needs permission first. The full terms:',
  'about.licenceName': 'PolyForm Noncommercial 1.0.0',
  'about.attributions': 'Built with',
  'about.attributionsBody':
    'These are other people’s work, included in the app and used under their own terms:',

  'about.contact': 'Getting in touch',
  'about.contactBody':
    'There is no contact form, because there is no server to receive one. Anything about the app itself — a bug, something confusing, an idea — belongs on GitHub, where it is public and does not get lost. Anything else can go through the contact details on my own site.',
  'about.reportProblem': 'Report a problem',
  'about.contactMe': 'Contact me',

  'about.version': 'Version {build}',
  'about.updateNote': 'the Library tab can force a fresh copy if this looks out of date',

  // -- version, in the library tab ------------------------------------------
  'version.title': 'Version',
  'version.built': 'Built {when}.',
  'version.body':
    'LibrAPP keeps a copy of itself on this device so it opens without a network. That copy usually replaces itself on the next visit. If it seems stuck on an older version, throw it away and fetch the current one.',
  'version.refresh': 'Fetch a fresh copy',
  'version.safe':
    'This discards only the app. Your library, your sources and your corrections are not stored here and are not touched.',

  // -- how it was made ------------------------------------------------------
  'foot.ai': 'AI use',

  'about.ai': 'AI, and how this was built',
  'about.aiBody':
    'LibrAPP was written by one person working with an AI assistant, over a series of sessions. Most of the code was typed by the model. Every decision about what to build was the person’s.',
  'about.ai.author': 'Jesús J. Ballesteros',
  'about.ai.author.did':
    'conceived the app and decided every step of it — what to build next, which of the proposed approaches to take, what to leave out, and when to stop. He supplied everything it was tested against: his own shelves, his own exports, his own devices. He reviewed the results, and corrected them.',
  'about.ai.assistant': 'Claude, an AI assistant',
  'about.ai.assistant.did':
    'proposed approaches when asked and occasionally when not, wrote the code and the documentation, and carried out the changes he decided on.',
  'about.ai.testers': 'A few early testers',
  'about.ai.testers.did':
    'used it and said what did not work. More than one thing here exists because of that.',
  'about.aiReview':
    'The review was not a formality. The assistant got things wrong — it once reported that a cut-off title had been repaired when it had not, and it chose a way of splitting photographs that fell apart on a close-up of three books. Both were caught by someone checking the output against the actual shelf. That experience is why this app shows you what a model read and waits for you to approve it, rather than importing it quietly.',
  'about.aiNotYourBooks':
    'All of that is about how the program was written. It has nothing to do with the contents of your catalog: no entry is invented, every book comes from a source you provided, and the AI features inside the app are optional, off until you add a key, and always show you the result before anything is kept.',

  'key.saveAnyway': 'Save it anyway',

  'list.savedAs': 'Saved as {name}.',

  'shelf.dropTile': 'Discard',
  'shelf.keepTile': 'Keep',
  'shelf.droppedTag': 'discarded',
  'shelf.discardHint':
    'Discard any tile that holds no readable spine \u2014 a wall, a lamp, the edge of a rug. Discarded tiles are not sent and not paid for.',
  'shelf.tileCountKept': '{kept} of {total} tiles',
  'shelf.noneKept': 'Every tile is discarded, so there is nothing to read. Keep at least one.',
  'shelf.stop': 'Stop',
  'shelf.stopped': 'Stopped before a reply arrived.',
  'shelf.timedOut':
    'No reply after {minutes} minutes, so the request was given up. The service may be busy, or unreachable from this page.',
  'shelf.failed': 'The read failed.',
  'shelf.failedUnknown': 'It failed without saying why.',
  'shelf.copyFailure': 'Copy this message',
  'shelf.usingService': 'Service: {service} \u00b7 model: {model}',

  'landing.next.title': 'Then ask it things',
  'landing.next.body':
    'A catalog is a starting point, not the end of it. The desk uses your shelves as context: what to read next and why, which books by an author you have collected unevenly are missing, what threads run through what you own, a list for a long flight or a summer. It answers about your books rather than books in general.',
  'landing.next.action': 'Open the LibrAPPrian’s desk',
  'landing.next.empty': 'Ready as soon as there are books here.',
  'desk.estimateNote': 'an estimate. What it actually cost appears with the answer.',

  // -- lent and borrowed ----------------------------------------------------
  'book.lentTo': 'Lent to',
  'book.borrowedFrom': 'Borrowed from',

  'editor.whereIsIt': 'Away from the shelf',
  'editor.loanHint':
    'Only one of these applies at a time. A book you lent is still yours; a book you borrowed is not.',
  'editor.lentTo': 'Lent to',
  'editor.lentOn': 'Lent on',
  'editor.borrowedFrom': 'Borrowed from',
  'editor.borrowedOn': 'Borrowed on',
  'editor.bothLoans': 'A book cannot be lent out and borrowed at the same time.',

  'catalog.whereIs': 'Where',
  'catalog.favourites': 'Favourites',
  'catalog.favouritesOnly': 'Favourites only',
  'catalog.atHome': 'on the shelf',
  'catalog.lentOut': 'lent out',
  'catalog.borrowed': 'borrowed',

  'desk.away': 'Away from the shelf',
  'desk.favourites': 'The ones marked',
  'desk.favouritesNote': 'Books singled out by hand. These carry more weight than anything the catalog works out on its own.',
  'desk.showFavourites': 'See them all in the catalog',
  'desk.awayNote':
    'Books that are not where they should be. Recorded by hand, one entry at a time, since nothing else can know.',
  'desk.lentGroup': 'Lent out ({n})',
  'desk.borrowedGroup': 'Borrowed and still here ({n})',
  'desk.nothingAway': 'Nothing is out of the house.',
  'desk.withWhom': 'with {who}',
  'desk.fromWhom': 'from {who}',
  'desk.sinceUnknown': 'no date recorded',

  // -- the word cloud -------------------------------------------------------
  'desk.themes': 'What it keeps coming back to',
  'desk.themesNote':
    'Keywords used by more than one book, drawn larger the more often they appear. Pick one to see those books.',
  'cloud.none': 'No keyword is used by more than one book yet.',
  'cloud.count': 'used by {n} books',
  'cloud.label': '{word}, used by {n} books',
  'cloud.note': 'Showing {drawn} of {distinct} keywords. The rest are used once each.',
  'catalog.taggedWith': 'tagged {tag}',

  // -- extras a model can be asked for --------------------------------------
  'book.abstract': 'Abstract:',
  'book.published': 'First published',
  'book.pages': 'Pages, typical edition',
  'book.rating': 'Rating',
  'book.originalLanguage': 'Originally in',
  'flag.recalled_details':
    'some details here were recalled by a model, not read from the photograph',

  'shelf.extras': 'Ask for more than the titles',
  'shelf.extrasNote':
    'Each of these adds to what the model is asked for, on both routes, and to what the request costs.',
  'shelf.extras.read': 'Read from the photograph',
  'shelf.extras.recalled': 'Recalled by the model',
  'shelf.extras.recalledWarning':
    'These are not in your photograph. The model produces them from what it was trained on, so they can be wrong about a real book. Anything filled in this way is marked on the book and counted as lower confidence.',
  'shelf.extra.publisher': 'Publisher or imprint',
  'shelf.extra.edition': 'Edition or printing',
  'shelf.extra.language': 'Language on the cover',
  'shelf.extra.series': 'Series and volume number',
  'shelf.extra.duplicates': 'Merge a book showing in two tiles',
  'shelf.extra.abstract': 'A short abstract',
  'shelf.extra.published': 'Year first published',
  'shelf.extra.rating': 'A general reader rating',
  'shelf.extra.original': 'Original language and whether this is a translation',
  'shelf.extra.pages': 'The page count of a typical edition',
  'shelf.noCover':
    'Cover images are not offered. A model can only return a link, and fetching one would tell whoever hosts the image which books you own.',
  'shelf.recalledCount': '{n} book(s) carry a recalled detail',

  'editor.noPersonalAuthor':
    'No named author. The sources describe this as \u201c{label}\u201d, which is a description rather than a person, so it is not filled in above.',
  'editor.noAuthorRecorded':
    'No author recorded. Leave this blank for an anonymous or corporate work, or type one in.',

  'nav.about': 'About',
  'nav.about.hint': 'What this is, who made it, and the terms',
  'sidebar.holdings': 'The holdings',
  'about.eyebrow': 'Colophon',
  'theme.label': 'Theme',
  'theme.light': 'Day',
  'theme.dark': 'Night',
  'theme.following': 'Press again to follow the system',

  'catalog.eyebrow': 'Shelf list',
  'catalog.moreFilters': 'more filters',
  'catalog.fewerFilters': 'fewer filters',
  'catalog.hiddenFiltersOn': 'Also filtering by {filters}, which is hidden.',
  'catalog.showThem': 'Show those filters',
  'catalog.clearTag': 'Clear',
  'catalog.viewMode': 'How to show the books',
  'catalog.mode.list': 'List',
  'catalog.mode.spines': 'Spines',
  'catalog.spineWall': 'The books as spines on a shelf',
  'catalog.spinesCaption':
    'Colour is fixed per book so a spine keeps it. Height comes from the page count where one was recorded, and from the length of the title where none was, so a shelf can mix the two.',
  'catalog.spinesEmpty': 'No book here has a spine to draw.',
}
