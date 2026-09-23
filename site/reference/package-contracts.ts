import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { documentHeadings } from './headings'
import type { ReferenceDocument } from './types'
import { packageEditorial } from './package-editorial'
import { declarationProgram, publicDeclaration, formatDeclaration, declarationComment, ts } from './package-declarations'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')

function typeTarget(value: any): string | undefined {
  if (typeof value === 'string') return value.endsWith('.d.ts') ? value : undefined
  if (!value || typeof value !== 'object') return
  if (typeof value.types === 'string') return value.types
  for (const child of Object.values(value)) { const target = typeTarget(child); if (target) return target }
}

export async function buildPackageContracts(repo: string): Promise<ReferenceDocument[]> {
  const census = JSON.parse(await readFile(path.join(repo, '.ai/contracts/api-census.json'), 'utf8'))
  const contract = JSON.parse(await readFile(path.join(repo, '.ai/contracts/public-api.json'), 'utf8'))
  const packages: { name: string; manifest: any; directory: string; entries: { subpath: string; file: string }[] }[] = []
  for (const [name, value] of Object.entries<any>(contract.packages)) {
    if (!census.records.some((record: any) => record.package === name && record.visibility === 'public')) continue
    const directory = path.resolve(repo, 'packages', value.directory)
    const manifest = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'))
    const entries = Object.entries(manifest.exports ?? {}).flatMap(([subpath, value]) => {
      const target = typeTarget(value)
      if (!target) return []
      const publicSource = path.resolve(directory, target.replace('./dist/', './src/').replace(/\.d\.ts$/, '.ts'))
      return [{ subpath, file: existsSync(publicSource) ? publicSource : path.resolve(directory, target) }]
    })
    for (const entry of entries) if (!existsSync(entry.file)) throw new Error(`Build ${name} before generating Reference (${entry.file}).`)
    if (Object.keys(manifest.exports ?? {}).length) packages.push({ name, manifest, directory, entries })
  }
  const config = ts.readConfigFile(path.join(repo, 'site/tsconfig.json'), ts.sys.readFile)
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, path.join(repo, 'site')).options
  const program = declarationProgram(packages.flatMap(pkg => pkg.entries.map(entry => entry.file)), {
    ...options, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true, noEmit: true, allowJs: true
  })
  const checker = program.getTypeChecker()
  return packages.map(pkg => {
    const editorial = packageEditorial[pkg.name]
    if (!editorial) throw new Error(`Missing package guidance: ${pkg.name}`)
    const body = ['## Public entrypoints', '', editorial.introduction, '', '| Import path | Purpose |', '| --- | --- |']
    for (const subpath of Object.keys(pkg.manifest.exports)) {
      const specifier = pkg.name + (subpath === '.' ? '' : subpath.slice(1))
      const purpose = editorial.entries[subpath]
      if (!purpose) throw new Error(`Missing entrypoint guidance: ${specifier}`)
      body.push(`| [\`${specifier}\`](#entry-${hash(specifier).slice(0, 12)}) | ${purpose} |`)
    }
    body.push('', 'Declarations show the public surface of each import path. Referenced type names may be local to the package; import only names listed as exports here. Private implementation is omitted, while constructor restrictions remain visible.', '')
    const aliases = [pkg.name]
    const identifierAnchors: Record<string, string> = {}
    const dependencies: string[] = []
    for (const [subpath, value] of Object.entries(pkg.manifest.exports)) {
      const specifier = pkg.name + (subpath === '.' ? '' : subpath.slice(1))
      aliases.push(specifier)
      identifierAnchors[specifier] = `entry-${hash(specifier).slice(0, 12)}`
      body.push(`## ${specifier} {#${identifierAnchors[specifier]}}`, '', editorial.entries[subpath], '')
      const entry = pkg.entries.find(entry => entry.subpath === subpath)
      if (!entry) {
        if (subpath.endsWith('.css') || value && typeof value === 'object' && 'style' in value) body.push('```css', `@import "${specifier}";`, '```', '')
        else body.push('Published asset mapping:', '', '```json', JSON.stringify(value, null, 2), '```', '')
        continue
      }
      const source = program.getSourceFile(entry.file)
      if (!source) throw new Error(`Missing public declaration ${entry.file}`)
      dependencies.push(source.text)
      const symbol = checker.getSymbolAtLocation(source)
      const symbols: any[] = symbol ? checker.getExportsOfModule(symbol) : []
      if (!symbols.length) {
        const ambient = source.statements.some((node: any) => ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name))
        body.push(ambient ? 'Ambient module declarations for TypeScript. Include this entry in the host’s type configuration.' : 'This entry has no named or default exports. Loading it runs its host entrypoint.', '')
        if (ambient) body.push('```typescript', source.text.trim(), '```', '')
      }
      if (symbols.length > 8) {
        body.push('| Export | Kind |', '| --- | --- |')
        for (const exported of [...symbols].sort((a, b) => a.name.localeCompare(b.name))) {
          const resolved = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
          const kind = resolved.flags & ts.SymbolFlags.Class ? 'Class' : resolved.flags & ts.SymbolFlags.Function ? 'Function' : resolved.flags & ts.SymbolFlags.Interface ? 'Interface' : resolved.flags & ts.SymbolFlags.TypeAlias ? 'Type' : 'Value'
          body.push(`| [\`${exported.name}\`](#api-${hash(`${specifier}#${exported.name}`).slice(0, 12)}) | ${kind} |`)
        }
        body.push('')
      }
      for (const exported of symbols.sort((a, b) => a.name.localeCompare(b.name))) {
        const qualified = `${specifier}#${exported.name}`
        const anchor = `api-${hash(qualified).slice(0, 12)}`
        aliases.push(exported.name, qualified)
        identifierAnchors[qualified] = anchor
        identifierAnchors[exported.name] ??= anchor
        const resolved = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
        const shared = exported.name === 'default' && symbols.find(candidate => candidate.name !== 'default'
          && (candidate.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(candidate) : candidate) === resolved)
        const comment = shared ? `Default export of [\`${shared.name}\`](#api-${hash(`${specifier}#${shared.name}`).slice(0, 12)}).` : declarationComment(resolved)
        const declaration = formatDeclaration(shared ? `export { ${shared.name} as default };` : publicDeclaration(resolved, checker)
          + (exported.name !== resolved.name && resolved.name !== 'default' ? `\nexport { ${resolved.name} as ${exported.name} };` : ''))
        if (!declaration) throw new Error(`Unresolved public declaration ${specifier}#${exported.name}`)
        dependencies.push(declaration)
        body.push(`### ${exported.name} {#${anchor}}`, '', ...(comment ? [comment, ''] : []), '```typescript declaration', declaration, '```', '')
      }
    }
    body.push('## Using this contract', '', editorial.usage, '')
    const markdown = body.join('\n')
    const id = `packages/${pkg.name.replace('@master/', '')}`
    return { id, kind: 'package', title: pkg.name, description: pkg.manifest.description, category: 'Package APIs', url: `/reference/${id}`, source: `packages/${path.basename(pkg.directory)}/package.json`, sourceDigest: hash(JSON.stringify(pkg.manifest) + JSON.stringify(editorial) + dependencies.join('\n')), language: 'en', aliases: [...new Set(aliases)], identifierAnchors, terms: [], rows: [], examples: [], related: ['rules/declarations', 'tools/mcp/mastercss_inspect_class'], markdown, headings: documentHeadings(markdown), extractionNotes: [] } satisfies ReferenceDocument
  })
}
