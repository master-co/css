import { createHash } from 'node:crypto'
import { glob, readFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { discoverManifestEntries } from '@master/css-compiler/project'
import { resolveStylesheetDependenciesSync, type MasterCSSStylesheetDependencies } from '@master/css-compiler/node'
import type { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import { staticFingerprint } from './static-state'

export const bytesFingerprint = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex')

export interface StaticSnapshot {
  entries: string[]
  resolutions: (MasterCSSStylesheetDependencies & { entry: string })[]
  sources: string[]
  dependencies: string[]
  contents: Map<string, Buffer | null>
  hashes: Map<string, string | null>
  fingerprint: string
}

/** One immutable read per path; extraction and identity use the same bytes. */
export async function captureStaticSnapshot(projectDir: string, scanner: MasterCSSScanner, dependencies: readonly string[], inputs: Readonly<Record<string, { source: string }>> = {}): Promise<StaticSnapshot> {
  const sources: string[] = []
  // Outputs are never inputs; exclude their trees before walking, not only after
  // visiting every generated module in a growing bundler output directory.
  const outputPatterns = (scanner.options.outputDirectories ?? [])
    .map(directory => relative(projectDir, resolve(projectDir, directory)).replaceAll('\\', '/'))
    .filter(directory => !isAbsolute(directory) && directory !== '..' && !directory.startsWith('../'))
    .flatMap(directory => directory ? [directory, `${directory}/**`] : ['**'])
  for await (const source of glob('**/*', {
    cwd: projectDir, exclude: [...(scanner.options.exclude || []), '**/.master/**', ...outputPatterns], withFileTypes: true
  })) {
    if (!source.isFile()) continue
    const path = resolve(source.parentPath, source.name)
    if (scanner.isModuleAllowed(path)) sources.push(path)
  }
  sources.sort()
  // Rediscovery detects newly added/removed CSS entries, including on cache hits.
  const entries = [...await discoverManifestEntries({ root: projectDir })]
  const required = new Set([...sources, ...entries, ...Object.keys(inputs)])
  const reads = new Map<string, Promise<Buffer | null>>()
  const read = (file: string) => {
    let pending = reads.get(file)
    if (!pending) {
      pending = readFile(file).catch(error => {
        if (required.has(file) || (error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
        return null
      })
      reads.set(file, pending)
    }
    return pending
  }
  // Re-resolve through the compiler: package CSS entry selection can change
  // without changing any bytes in the previously resolved dependency graph.
  const resolutions = await Promise.all([...new Set([...entries, ...Object.keys(inputs)])].map(async entry => {
    const bytes = await read(entry)
    const resolution = resolveStylesheetDependenciesSync(entry, inputs[entry]?.source ?? bytes!.toString('utf8'), { projectDir })
    return { entry, ...resolution }
  }))
  const paths = [...new Set([...required, ...dependencies, ...resolutions.flatMap(item => item.dependencies), ...scanner.sourcePolicyDependencies])].sort()
  const contents = new Map(await Promise.all(paths.map(async file => [file, await read(file)] as const)))
  const hashes = new Map([...contents].map(([file, bytes]) => [file, bytes === null ? null : bytesFingerprint(bytes)]))
  return { entries, resolutions, sources, dependencies: paths, contents, hashes,
    fingerprint: staticFingerprint({ entries, resolutions, sources, files: [...hashes] }) }
}
