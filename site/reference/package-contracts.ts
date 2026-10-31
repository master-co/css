import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { documentHeadings } from './headings'
import type { ReferenceDocument } from './types'
import { packageEditorial } from './package-editorial'

/** The website explains where to start; GitHub owns the complete API source. */
export async function buildPackageContracts(repo: string): Promise<ReferenceDocument[]> {
  const census = JSON.parse(await readFile(path.join(repo, '.ai/contracts/api-census.json'), 'utf8'))
  const contract = JSON.parse(await readFile(path.join(repo, '.ai/contracts/public-api.json'), 'utf8'))
  const body = [
    'Choose a package by the work it owns. Each section lists its public import paths and links to its current source on GitHub. Read signatures, overloads and types there; this page does not reproduce declarations.',
    '', 'The source links follow the repository’s `rc` branch. For an installed release, also consult the declarations shipped with that package.', ''
  ]
  const aliases: string[] = []
  const identifierAnchors: Record<string, string> = {}
  const inputs: string[] = []
  for (const [name, value] of Object.entries<any>(contract.packages)) {
    if (!census.records.some((record: any) => record.package === name && record.visibility === 'public')) continue
    const directory = path.join(repo, 'packages', value.directory)
    const raw = await readFile(path.join(directory, 'package.json'), 'utf8')
    const manifest = JSON.parse(raw)
    if (!Object.keys(manifest.exports ?? {}).length) continue
    const editorial = packageEditorial[name]
    if (!editorial) throw new Error(`Missing package guidance: ${name}`)
    const anchor = name.replace('@master/', '')
    aliases.push(name)
    identifierAnchors[name] = anchor
    const source = `https://github.com/master-co/css/tree/rc/packages/${value.directory}`
    body.push(`## ${name} {#${anchor}}`, '', editorial.introduction, '', '| Import path | Purpose |', '| --- | --- |')
    for (const subpath of Object.keys(manifest.exports)) {
      const specifier = name + (subpath === '.' ? '' : subpath.slice(1))
      const purpose = editorial.entries[subpath]
      if (!purpose) throw new Error(`Missing entrypoint guidance: ${specifier}`)
      body.push(`| \`${specifier}\` | ${purpose} |`)
      aliases.push(specifier)
      identifierAnchors[specifier] = anchor
      for (const symbol of value.entrypoints[subpath] ?? []) {
        const qualified = `${specifier}#${symbol}`
        aliases.push(symbol, qualified)
        identifierAnchors[qualified] = anchor
        identifierAnchors[symbol] ??= anchor
      }
    }
    body.push('', editorial.usage, '', `[Source and README](${source}) · [Public export mappings](${source.replace('/tree/', '/blob/')}/package.json)`, '')
    inputs.push(raw)
  }
  const markdown = body.join('\n')
  return [{
    id: 'packages', kind: 'package', title: 'Packages',
    description: 'Choose a public package, find its import paths, and open its API source on GitHub.',
    category: 'Tools', url: '/reference/packages', source: 'site/reference/package-editorial.ts',
    sourceDigest: createHash('sha256').update(inputs.join('\n') + JSON.stringify(packageEditorial) + JSON.stringify(contract) + JSON.stringify(census)).digest('hex'),
    language: 'en', aliases: [...new Set(aliases)], identifierAnchors, terms: ['API', 'exports', 'TypeScript'],
    rows: [], examples: [], related: ['tools/cli', 'tools/mcp'], markdown,
    headings: documentHeadings(markdown), extractionNotes: []
  }]
}
