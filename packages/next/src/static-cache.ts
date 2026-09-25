import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getToolingBindingInfo } from '@master/css-tooling/node'
import { staticFingerprint } from './static-state'
import { bytesFingerprint } from './static-snapshot'
import { publishFile } from './static-publication'

export interface StaticPublicationRecord {
  version: 1
  producer: string
  fingerprint: string
  reusable: boolean
  dependencies: string[]
  outputs: [string, string][]
}
export const staticPublicationPath = (output: string) => resolve(dirname(output), 'next-static-publication.json')
let producer: string | undefined
export function staticProducerFingerprint() {
  if (producer) return producer
  const require = createRequire(import.meta.url)
  const packages = ['@master/css-compiler', '@master/css-tooling', '@master/css', '@master/css-schema'].map(name => {
    const entry = require.resolve(name)
    let directory = dirname(entry)
    for (;;) {
      try {
        const json = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8')) as { name: string, version?: string }
        if (json.name === name) return [name, json.version ?? null, bytesFingerprint(readFileSync(entry))]
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
      const parent = dirname(directory)
      if (parent === directory) throw new Error(`Cannot identify ${name} for the Next static publication cache`)
      directory = parent
    }
  })
  const integration = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string, version?: string }
  const extension = extname(fileURLToPath(import.meta.url))
  const implementation = ['static', 'static-cache', 'static-snapshot', 'static-queue', 'static-inputs', 'static-publication', 'static-state', 'static-lock', 'options'].map(name =>
    bytesFingerprint(readFileSync(new URL(`./${name}${extension}`, import.meta.url))))
  producer = staticFingerprint({ integration: [integration.name, integration.version ?? null], packages, implementation, binding: getToolingBindingInfo(), node: process.versions.node })
  return producer
}

const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string')
const digest = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)

/** A disposable optimization, never the authoritative source inventory. */
export async function readStaticPublication(output: string, producer: string): Promise<StaticPublicationRecord | undefined> {
  let parsed: { record?: StaticPublicationRecord, checksum?: string }
  try { parsed = JSON.parse(await readFile(staticPublicationPath(output), 'utf8')) }
  catch (error) { if (error instanceof SyntaxError || (error as NodeJS.ErrnoException).code === 'ENOENT') return; throw error }
  const record = parsed?.record
  if (!record || record.version !== 1 || record.producer !== producer || !digest(record.fingerprint)
    || typeof record.reusable !== 'boolean' || !strings(record.dependencies) || !Array.isArray(record.outputs) || !record.outputs.length
    || !record.outputs.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && dirname(item[0]) === dirname(output) && digest(item[1]))
    || !record.outputs.some(([file]) => file === output)
    || new Set(record.outputs.map(([file]) => file)).size !== record.outputs.length
    || parsed.checksum !== staticFingerprint(record)) return
  return record
}

export async function staticOutputsMatch(record: StaticPublicationRecord) {
  const matches = await Promise.all(record.outputs.map(async ([file, hash]) => {
    try { return bytesFingerprint(await readFile(file)) === hash }
    catch (error) { if (['ENOENT', 'EISDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return false; throw error }
  }))
  return matches.every(Boolean)
}

export async function writeStaticPublication(output: string, record: StaticPublicationRecord) {
  await publishFile(staticPublicationPath(output), Buffer.from(JSON.stringify({ record, checksum: staticFingerprint(record) })), false)
}
