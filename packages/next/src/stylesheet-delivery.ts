import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { MasterCSSCompiledStylesheet, MasterCSSStylesheetDeliveryOptions } from '@master/css-compiler/stylesheet'
import { publishFile } from './static-publication'

const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

/**
 * URLs name the revision of the output they belong to. Compile once with a
 * placeholder of a revision's length, then substitute the revision: the text
 * keeps its length, so source map columns stay valid.
 */
const REVISION_PLACEHOLDER = 'x'.repeat(64) + '-'

/** A copy of `value` with `fields` replaced; lazily computed fields stay lazy. */
function override<T extends object>(value: T, fields: Record<string, unknown>): T {
  const descriptors = Object.getOwnPropertyDescriptors(value) as PropertyDescriptorMap
  for (const [key, field] of Object.entries(fields)) descriptors[key] = { value: field, enumerable: true, writable: true, configurable: true }
  return Object.defineProperties({}, descriptors) as T
}

function withRevision<T extends Pick<MasterCSSCompiledStylesheet, 'stylesheets' | 'css' | 'sourceMap'>>(result: T, revision: string): T {
  const swap = (text: string) => text.replaceAll(REVISION_PLACEHOLDER, revision)
  const { nativeCSS } = result as { nativeCSS?: unknown }
  return override(result, {
    css: swap(result.css),
    ...(result.sourceMap === undefined ? {} : { sourceMap: swap(result.sourceMap) }),
    ...(typeof nativeCSS === 'string' ? { nativeCSS: swap(nativeCSS) } : {}),
    ...(result.stylesheets ? { stylesheets: result.stylesheets.map(asset => ({ ...asset, href: swap(asset.href), css: swap(asset.css), sourceMap: swap(asset.sourceMap) })) } : {})
  })
}

/** The host loads entry CSS in place; publish every retained child before returning it. */
export async function deliverNextStylesheet<T extends Pick<MasterCSSCompiledStylesheet, 'entry' | 'stylesheets' | 'resources' | 'css' | 'sourceMap'>>(file: string, projectDir: string, onDependency: (file: string) => void,
  compile: (delivery: MasterCSSStylesheetDeliveryOptions) => Promise<T>, sharedGlobals = false) {
  const href = (output: string) => './' + output
  const resources = new Map<string, Buffer>()
  const read = (file: string) => {
    let bytes = resources.get(file)
    if (!bytes) { bytes = readFileSync(file);resources.set(file, bytes) }
    return bytes
  }
  let revision = REVISION_PLACEHOLDER
  const delivery: MasterCSSStylesheetDeliveryOptions = {
    get entryURL() { return href(revision + 'entry.css') },
    stylesheetURL: (owner, variant) => href(`${revision}${hash(owner + (variant ?? ''))}.css`),
    resourceURL: owner => href(`${hash(read(owner))}${extname(owner)}`),
    relativeResourceURLs: true,
    onDependency
  }
  const draft = await compile(delivery)
  // Generated globals have no local Module identity. Their resolved CSS already
  // contains content-addressed resource URLs, so identical resource sets from
  // separate modules can share one delivery entry without changing selectors.
  const identity = sharedGlobals
    ? hash(JSON.stringify({ version: 2, kind: 'generated-globals', stylesheets: draft.stylesheets?.map(({ css, sourceMap }) => ({ css, sourceMap })) }))
    : hash(file)
  const directory = join(projectDir, '.master/stylesheets', identity)
  revision = (sharedGlobals ? identity : hash(JSON.stringify({ version: 2, stylesheets: draft.stylesheets }))) + '-'
  const result = withRevision(draft, revision)
  const assets = new Map<string, Buffer>()
  const cssBytes = new Map<string, number>()
  const cssMaps = new Map<string, string>()
  const add = (url: string, bytes: Buffer) => {
    const output = fileURLToPath(new URL(url, pathToFileURL(join(directory, 'entry.css'))))
    if (output === file) throw new Error(`Cannot overwrite the Next stylesheet source: ${file}`)
    if (assets.has(output) && !assets.get(output)!.equals(bytes)) throw new Error(`Conflicting Next stylesheet asset: ${output}`)
    assets.set(output, bytes)
  }
  for (const asset of result.stylesheets ?? []) {
    const map = Buffer.from(asset.sourceMap).toString('base64')
    add(asset.href, Buffer.from(asset.css + `\n/*# sourceMappingURL=data:application/json;base64,${map} */\n`))
    cssBytes.set(fileURLToPath(new URL(asset.href, pathToFileURL(join(directory, 'entry.css')))), Buffer.byteLength(asset.css))
    cssMaps.set(fileURLToPath(new URL(asset.href, pathToFileURL(join(directory, 'entry.css')))), asset.sourceMap)
  }
  for (const asset of result.resources ?? []) add(asset.href, read(asset.file))
  for (const [output, bytes] of assets) { await publishFile(output, bytes, true);onDependency(output) }
  const entry = result.stylesheets!.find(asset => asset.id === result.entry)!
  const output = fileURLToPath(new URL(entry.href, pathToFileURL(join(directory, 'entry.css'))))
  const metadataPath = output + '.assets.json'
  const metadata = { version: 2, files: [...assets].map(([path, bytes]) => ({ name: relative(directory, path), sha256: hash(bytes), cssBytes: cssBytes.get(path), sourceMap: cssMaps.get(path) })) }
  await publishFile(metadataPath, Buffer.from(JSON.stringify(metadata)), true)
  onDependency(metadataPath)
  const request = relative(dirname(file), output).replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')
  return override(result, { css: `@import "${request.startsWith('.') ? request : './' + request}";`, sourceMap: JSON.stringify({ version: 3, sources: [], names: [], mappings: '' }) })
}
