import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveAndWritePublicEnv } from '../utils/public-env.js'

const siteDir = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const writeIndex = process.argv.indexOf('--write')
const output = writeIndex === -1
    ? path.join(siteDir, '.generated/public-env.json')
    : path.resolve(siteDir, process.argv[writeIndex + 1])

const publicEnv = resolveAndWritePublicEnv({
    fetchTags: process.argv.includes('--fetch-tags'),
    output
})

console.log(`[public-env] ${publicEnv.NEXT_PUBLIC_VERSION} ${publicEnv.NEXT_PUBLIC_URL}`)
