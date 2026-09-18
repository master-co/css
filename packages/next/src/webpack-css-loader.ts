import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, dirname, join, relative } from 'node:path'

interface LoaderContext {
  resourcePath: string
  rootContext: string
  sourceMap?: boolean
  _compilation: { outputOptions: { publicPath: string }, fullHash?: string, getPath(path: string, data: { hash?: string }): string }
  getOptions(): { loader: string, options: Record<string, unknown> }
  addDependency(file: string): void
  emitFile(file: string, content: Buffer, map?: object, info?: { immutable: boolean }): void
}
export const raw = true
const require = createRequire(import.meta.url)
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

/** Keep Next's ordinary CSS processing; only compiler-owned entry assets bypass it. */
export default function nextCSSLoader(this: LoaderContext, ...args: unknown[]) {
  const options = this.getOptions(), loaded = require(options.loader)
  const context = Object.create(this)
  context.getOptions = () => options.options
  if (!loaded.raw && Buffer.isBuffer(args[0])) args[0] = args[0].toString('utf8')
  return (loaded.default ?? loaded).apply(context, args)
}

export function pitch(this: LoaderContext) {
  const file = relative(this.rootContext, this.resourcePath).replace(/\\/g, '/')
  if (!/^\.master\/stylesheets\/[a-f0-9]{64}\/[a-f0-9]{64}-entry\.css$/.test(file)) return
  const metadataPath = this.resourcePath + '.assets.json'
  this.addDependency(metadataPath)
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
    version: number, files: { name: string, sha256: string, cssBytes?: number, sourceMap?: string }[]
  }
  if (metadata.version !== 2 || !Array.isArray(metadata.files)) throw new Error(`Invalid Next CSS publication: ${metadataPath}`)
  const directory = dirname(this.resourcePath), includeMaps = this.getOptions().options.sourceMap ?? this.sourceMap
  const prefix = `static/css/master/${hash(directory)}/${includeMaps ? 'maps' : 'css'}/`
  let hasEntry = false
  for (const asset of metadata.files) {
    if (asset.name !== basename(asset.name) || asset.name === '.' || asset.name === '..') throw new Error('Invalid Next CSS asset name')
    const source = join(directory, asset.name)
    this.addDependency(source)
    const bytes = readFileSync(source)
    if (hash(bytes) !== asset.sha256) throw new Error(`Changed immutable Next CSS asset: ${source}`)
    if (asset.cssBytes !== undefined && (!Number.isInteger(asset.cssBytes) || asset.cssBytes < 0 || asset.cssBytes > bytes.length)) throw new Error('Invalid Next CSS map boundary')
    // Supply the authored map through Webpack so host optimization can compose
    // its transformations with the compiler map instead of naming our cache file.
    const map = includeMaps && asset.sourceMap ? JSON.parse(asset.sourceMap) : undefined
    this.emitFile(prefix + asset.name, asset.cssBytes !== undefined ? bytes.subarray(0, asset.cssBytes) : bytes, map, { immutable: true })
    if (source === this.resourcePath) hasEntry = true
  }
  if (!hasEntry) throw new Error(`Missing Next CSS entry: ${this.resourcePath}`)
  // Next's extraction plugin recognizes this standalone import and hoists it.
  // Native imports, qualifiers and resource URLs remain in the emitted graph.
  const publicPath = this._compilation.getPath(this._compilation.outputOptions.publicPath, { hash: this._compilation.fullHash })
  if (publicPath === 'auto') throw new Error('Next CSS graph publication requires an explicit Next publicPath')
  const css = '@import url(' + JSON.stringify(publicPath + prefix + basename(this.resourcePath)) + ');'
  return `module.exports = [[module.id, ${JSON.stringify(css)}, ""]];`
}
