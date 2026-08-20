import { readFileSync } from 'node:fs'
import { readerProfile } from '../src/core/profile.js'
const catalog = JSON.parse(readFileSync(process.argv[2], 'utf8'))
process.stdout.write(readerProfile(catalog))
