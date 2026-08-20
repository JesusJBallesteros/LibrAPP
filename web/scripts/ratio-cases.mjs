// Prints the JS ratio() for every pair on stdin, so Python can check them.
// Reads JSON [[a, b], ...] and writes JSON [number, ...].
import { ratio } from '../src/core/difflib.js'

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => (input += chunk))
process.stdin.on('end', () => {
  const pairs = JSON.parse(input)
  process.stdout.write(JSON.stringify(pairs.map(([a, b]) => ratio(a, b))))
})
