import { readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { staticFingerprint } from './static-state'
import { publishFile } from './static-publication'

export interface StaticStyleInput { file: string, source: string, originalFingerprint: string, dependencies: Record<string, string> }
interface InputStore { version: 2, configuration: string, styles: Record<string, StaticStyleInput> }
export const staticInputPath = (output: string) => resolve(dirname(output), 'next-static-inputs.json')
export async function captureStaticStyleInput(file: string, source: string, dependencies: readonly string[] = []): Promise<StaticStyleInput> {
  return { file, source, originalFingerprint: staticFingerprint(await readFile(file, 'utf8')),
    dependencies: Object.fromEntries(await Promise.all([...new Set(dependencies)].sort().map(async path => [path, staticFingerprint(await readFile(path))]))) }
}
async function current(input: StaticStyleInput) {
  if (!(await stat(input.file)).isFile() || staticFingerprint(await readFile(input.file, 'utf8')) !== input.originalFingerprint) return false
  for (const [path, hash] of Object.entries(input.dependencies)) if (staticFingerprint(await readFile(path)) !== hash) return false
  return true
}
/** Called only under the project publication lock. */
export async function loadStaticStyleInputs(output: string, configuration: string, incoming?: StaticStyleInput) {
  const path = staticInputPath(output)
  let store: InputStore = { version: 2, configuration, styles: {} }
  try {
    const saved = JSON.parse(await readFile(path, 'utf8')) as InputStore
    if (saved.version === 2 && saved.configuration === configuration) store = saved
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
  for (const [file, input] of Object.entries(store.styles)) {
    try { if (!await current(input)) delete store.styles[file] }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; delete store.styles[file] }
  }
  if (incoming) {
    if (!await current(incoming)) throw new Error('Master CSS stylesheet changed during loader execution. Retry with the current source.')
    store.styles[incoming.file] = incoming
  }
  await publishFile(path, Buffer.from(JSON.stringify(store)), false)
  return store.styles
}
