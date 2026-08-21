// English strings. This file is the reference: every other language falls back
// to it key by key, so a missing translation shows English rather than a blank.
//
// Keys are grouped by where they appear. `{name}` placeholders are filled at
// render time.

export default {
  // -- landing ------------------------------------------------------------
  'landing.tagline': 'Create your full book catalog from a picture of your shelf.',
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
    'Reading spines from a photograph needs an AI assistant. You can paste the tiles into any assistant yourself, or give LibrAPP a key so it can do it. Everything else works without AI.',
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
    'That file is not a LibrAPP export. Choose the file you exported from Library → Export on the other device.',
  'error.notJson': 'That file is not readable as JSON. It may have been renamed or only partly downloaded.',
}
