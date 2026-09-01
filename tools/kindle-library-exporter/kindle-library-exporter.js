/* Reads the book list off your own Kindle library page and saves it as a CSV.
 *
 * It looks at the page in front of you and writes a file. It makes no network
 * request of any kind. It reads nothing but titles, authors and Amazon's own id
 * for each book, and it changes nothing in your account.
 *
 * Open https://read.amazon.com/kindle-library, scroll to the bottom so every
 * book has loaded, then paste this into the browser console and press Enter.
 */

(() => {
  const rows = document.querySelectorAll('[id^="title-"]')

  if (!rows.length) {
    console.error(
      'No books found on this page.\n' +
        'Either this is not the Kindle library page, or Amazon has changed it ' +
        'and this script needs updating.',
    )
    return
  }

  // A CSV field: wrapped in quotes, with any quote inside it doubled.
  const field = (text) => `"${String(text ?? '').trim().replace(/"/g, '""')}"`

  const lines = ['ASIN,Title,Authors']

  for (const row of rows) {
    const asin = row.id.replace('title-', '')
    const title = row.querySelector('p')?.innerText ?? ''
    const authors = document.querySelector(`#author-${asin}`)?.querySelector('p')?.innerText ?? ''
    if (title) lines.push([asin, title, authors].map(field).join(','))
  }

  const file = new Blob([lines.join('\n')], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = 'kindle-books.csv'
  link.click()
  URL.revokeObjectURL(link.href)

  console.log(`${lines.length - 1} books saved to kindle-books.csv`)
})()
