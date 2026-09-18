import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

export const NEXT_STYLESHEET_ASSET_PATTERN = /(?:^|\/)\.master\/stylesheets\/[a-f0-9]{64}\/([a-f0-9]{64})-(?:entry|[a-f0-9]{64})\.css$/
export const raw = true
interface LoaderContext {
  resourcePath: string
  addDependency(file: string): void
  callback(error: Error | null, source?: Buffer, map?: object): void
}

/** Transport the compiler map through the host API; inline comments are ignored by Turbopack. */
export default function nextStylesheetMapLoader(this: LoaderContext, source: Buffer) {
  try {
    const match = NEXT_STYLESHEET_ASSET_PATTERN.exec(this.resourcePath.replace(/\\/g, '/'))
    if (!match) throw new Error(`Invalid Next CSS map input: ${this.resourcePath}`)
    const metadataPath = join(dirname(this.resourcePath), match[1] + '-entry.css.assets.json')
    this.addDependency(metadataPath)
    const metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as {
      version: number, files: { name: string, sha256: string, cssBytes?: number, sourceMap?: string }[]
    }
    if (metadata.version !== 2 || !Array.isArray(metadata.files)) throw new Error(`Invalid Next CSS publication: ${metadataPath}`)
    const asset = metadata.files.find(asset => asset.name === basename(this.resourcePath))
    if (!asset || createHash('sha256').update(source).digest('hex') !== asset.sha256) throw new Error(`Changed or missing immutable Next CSS asset: ${this.resourcePath}`)
    if (!Number.isInteger(asset.cssBytes) || asset.cssBytes! < 0 || asset.cssBytes! > source.length || typeof asset.sourceMap !== 'string') throw new Error('Invalid Next CSS map boundary')
    const map = JSON.parse(asset.sourceMap)
    if (map.version !== 3 || !Array.isArray(map.sources) || typeof map.mappings !== 'string') throw new Error('Invalid Next CSS source map')
    this.callback(null, source.subarray(0, asset.cssBytes), map)
  } catch (error) { this.callback(error as Error) }
}
