import { languageOf } from '@master/internal-site/common/locales.js'
import { referenceText as text, referenceEditorial } from './copy'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { documentHeadings } from './headings'
import type { ReferenceDocument } from './types'
import { packageEditorial as sourcePackageEditorial } from './package-editorial'
import { referenceIllustrationMarkdown } from './illustrations'

/** The website explains where to start; GitHub owns the complete API source. */
export async function buildPackageContracts(repo: string, locale = 'en'): Promise<ReferenceDocument[]> {
  const packageEditorial = referenceEditorial(sourcePackageEditorial, 'packages', locale, 'editorial')
  const census = JSON.parse(await readFile(path.join(repo, '.ai/contracts/api-census.json'), 'utf8'))
  const contract = JSON.parse(await readFile(path.join(repo, '.ai/contracts/public-api.json'), 'utf8'))
  const body = [
    text('packages', 'body-0', locale),
    '', text('packages', 'body-1', locale), ''
  ]
  body.push(text('packages', 'body-2', locale),
    text('packages', 'body-3', locale), '| --- | --- |',
    text('packages', 'body-4', locale),
    text('packages', 'body-5', locale),
    text('packages', 'body-6', locale),
    text('packages', 'body-7', locale),
    text('packages', 'body-8', locale),
    text('packages', 'body-9', locale),
    text('packages', 'body-10', locale),
    text('packages', 'body-11', locale),
    referenceIllustrationMarkdown('compiler-output-ownership', locale),
    text('packages', 'body-12', locale), '')
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
    body.push(`## ${name} {#${anchor}}`, '', editorial.introduction, '', text('packages', 'body-13', locale), '| --- | --- |')
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
    body.push('', editorial.usage, '', text('packages', 'source-links', locale).replaceAll('%%source%%', source).replaceAll('%%exports%%', source.replace('/tree/', '/blob/') + '/package.json'), '')
    inputs.push(raw)
  }
  const markdown = body.join('\n')
  return [{
    id: 'packages', kind: 'package', title: text('packages', 'title', locale),
    description: text('packages', 'description', locale),
    category: 'Tools', url: '/reference/packages', source: 'site/reference/package-editorial.ts',
    sourceDigest: createHash('sha256').update(inputs.join('\n') + JSON.stringify(packageEditorial) + JSON.stringify(contract) + JSON.stringify(census)).digest('hex'),
    language: languageOf(locale), locale, aliases: [...new Set(aliases)], identifierAnchors, terms: ['API', 'exports', 'TypeScript'],
    rows: [], examples: [], related: ['tools/cli', 'tools/mcp'], markdown,
    headings: documentHeadings(markdown), extractionNotes: []
  }]
}
