import { createHash, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { link, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { MasterCSSStylesheetComposition, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

export async function publishFile(file: string, bytes: Buffer, immutable: boolean) {
  try {
    const current = await readFile(file)
    if (current.equals(bytes)) return
    if (immutable) throw new Error(`Conflicting immutable Master CSS asset: ${file}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  await mkdir(dirname(file), { recursive: true })
  const temporary = `${file}.tmp-${randomUUID()}`
  try {
    await writeFile(temporary, bytes, { flag: 'wx' })
    if (immutable) {
      try { await link(temporary, file) }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || !(await readFile(file)).equals(bytes)) throw error
      }
    } else await rename(temporary, file)
  } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error }) }
}

/** Publish complete compiler output before replacing the fixed host entry. */
export async function publishStaticStylesheets(outputPath: string,
  compose: (delivery: MasterCSSStylesheetDeliveryOptions) => Promise<MasterCSSStylesheetComposition>,
  verifySnapshot: (dependencies: readonly string[]) => Promise<void> = async () => {},
  repair?: ReadonlyMap<string, string>) {
  const resourceBytes = new Map<string, Buffer>()
  const readResource = (file: string) => {
    let bytes = resourceBytes.get(file)
    if (!bytes) { bytes = readFileSync(file);resourceBytes.set(file, bytes) }
    return bytes
  }
  const prefix = `${basename(outputPath, extname(outputPath))}-`
  let revision = ''
  const delivery: MasterCSSStylesheetDeliveryOptions = {
    entryURL: `./${encodeURIComponent(basename(outputPath))}`,
    stylesheetURL: (file, variant) => `./${prefix}style-${revision}${hash(file + (variant ?? ''))}.css`,
    resourceURL: file => `./${prefix}resource-${hash(readResource(file))}${encodeURIComponent(extname(file))}`,
    relativeResourceURLs: true
  }
  let composition = await compose(delivery)
  revision = `${hash(JSON.stringify({ css: composition.css, stylesheets: composition.stylesheets }))}-`
  composition = await compose(delivery)
  const assets = new Map<string, Buffer>()
  const add = (href: string, bytes: Buffer) => {
    const file = fileURLToPath(new URL(href, pathToFileURL(outputPath)))
    if (file === outputPath) {
      if (!bytes.equals(Buffer.from(composition.css))) throw new Error(`Conflicting Master CSS entry: ${file}`)
      return
    }
    if (assets.has(file) && !assets.get(file)!.equals(bytes)) throw new Error(`Conflicting Master CSS asset: ${file}`)
    assets.set(file, bytes)
  }
  for (const asset of composition.stylesheets ?? []) add(asset.href, Buffer.from(asset.css))
  for (const asset of composition.resources ?? []) add(asset.href, readResource(asset.file))
  await verifySnapshot(composition.dependencies ?? [])
  for (const [file, bytes] of assets) await publishFile(file, bytes, repair?.get(file) !== hash(bytes))
  await verifySnapshot(composition.dependencies ?? [])
  for (const [file, bytes] of resourceBytes) {
    if (!bytes.equals(await readFile(file))) throw Object.assign(new Error('Master CSS resource changed during publication'), { code: 'MASTER_SNAPSHOT_CHANGED' })
  }
  await publishFile(outputPath, Buffer.from(composition.css), false)
  // Keep immutable prior revisions for host builds still resolving older imports.
  return { dependencies: composition.dependencies ?? [], outputFiles: [outputPath, ...assets.keys()],
    outputs: [[outputPath, hash(Buffer.from(composition.css))], ...[...assets].map(([file, bytes]) => [file, hash(bytes)])] as [string, string][] }
}
