import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { documentHeadings } from './headings'
import type { ReferenceDocument } from './types'

/** Uses the repository's existing compiler-API compatibility dependency at build time. */
const ts = createRequire(new URL('../../package.json', import.meta.url))('typescript6')
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
  const program = ts.createProgram(packages.flatMap(pkg => pkg.entries.map(entry => entry.file)), {
    ...options, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true, noEmit: true, allowJs: true
  })
  const checker = program.getTypeChecker()
  return packages.map(pkg => {
    const body = ['## Public entrypoints', '', 'Import only from the published paths below. Declarations are resolved from the current public entrypoint sources and published type entries. CSS assets are listed separately from JavaScript and TypeScript APIs.', '']
    const aliases = [pkg.name]
    const identifierAnchors: Record<string, string> = {}
    const dependencies: string[] = []
    for (const [subpath, value] of Object.entries(pkg.manifest.exports)) {
      const specifier = pkg.name + (subpath === '.' ? '' : subpath.slice(1))
      aliases.push(specifier)
      identifierAnchors[specifier] = `entry-${hash(specifier).slice(0, 12)}`
      body.push(`## ${specifier} {#${identifierAnchors[specifier]}}`, '')
      const entry = pkg.entries.find(entry => entry.subpath === subpath)
      if (!entry) { body.push('Published asset:', '', '```json', JSON.stringify(value, null, 2), '```', ''); continue }
      const source = program.getSourceFile(entry.file)
      if (!source) throw new Error(`Missing public declaration ${entry.file}`)
      dependencies.push(source.text)
      const symbol = checker.getSymbolAtLocation(source)
      const symbols: any[] = symbol ? checker.getExportsOfModule(symbol) : []
      if (!symbols.length) body.push('Ambient declarations; load this type entrypoint in the host TypeScript configuration.', '', '```typescript', source.text, '```', '')
      for (const exported of symbols.sort((a, b) => a.name.localeCompare(b.name))) {
        const qualified = `${specifier}#${exported.name}`
        const anchor = `api-${hash(qualified).slice(0, 12)}`
        aliases.push(exported.name, qualified)
        identifierAnchors[qualified] = anchor
        identifierAnchors[exported.name] ??= anchor
        const resolved = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
        const comment = ts.displayPartsToString(resolved.getDocumentationComment(checker))
        const declarations: any[] = resolved.declarations ?? []
        const declaration = declarations.map(node => {
          if (ts.isFunctionDeclaration(node)) {
            const signature = checker.getSignatureFromDeclaration(node)
            return `${exported.name === 'default' ? 'export default function' : `declare function ${exported.name}`}${checker.signatureToString(signature, undefined, ts.TypeFormatFlags.NoTruncation)};`
          }
          if (ts.isVariableDeclaration(node) || ts.isBindingElement(node)) return `declare const ${exported.name}: ${checker.typeToString(checker.getTypeOfSymbolAtLocation(resolved, node), undefined, ts.TypeFormatFlags.NoTruncation)};`
          if (ts.isClassDeclaration(node)) {
            const printer = ts.createPrinter()
            const transformed = ts.transform(node, [(context: any) => {
              const visit = (child: any): any => {
                if (ts.isMethodDeclaration(child) || ts.isConstructorDeclaration(child) || ts.isGetAccessorDeclaration(child) || ts.isSetAccessorDeclaration(child)) {
                  const signature = checker.getSignatureFromDeclaration(child)
                  const type = ts.isConstructorDeclaration(child) || ts.isSetAccessorDeclaration(child) ? child.type : child.type ?? checker.typeToTypeNode(checker.getReturnTypeOfSignature(signature), undefined, ts.NodeBuilderFlags.NoTruncation)
                  const clone = { ...child, body: undefined, type }; return ts.visitEachChild(clone, visit, context)
                }
                if (ts.isPropertyDeclaration(child)) return { ...child, initializer: undefined, type: child.type ?? checker.typeToTypeNode(checker.getTypeAtLocation(child), undefined, ts.NodeBuilderFlags.NoTruncation) }
                return ts.visitEachChild(child, visit, context)
              }; return (root: any) => ts.visitNode(root, visit)
            }])
            const text = printer.printNode(ts.EmitHint.Unspecified, transformed.transformed[0], node.getSourceFile())
            transformed.dispose(); return text
          }
          return node.getText()
        }).join('\n')
        if (!declaration) throw new Error(`Unresolved public declaration ${specifier}#${exported.name}`)
        dependencies.push(declaration)
        body.push(`### ${exported.name} {#${anchor}}`, '', comment, '', '```typescript', declaration, '```', '')
      }
    }
    body.push('## Using this contract', '', 'Check the package and subpath before copying a symbol. Node-only entrypoints require Node; browser and integration entrypoints follow their host lifecycle. Type declarations do not by themselves verify a project manifest or generated CSS. Use the language reference and project-aware inspection tools for those checks.', '')
    const markdown = body.join('\n')
    const id = `packages/${pkg.name.replace('@master/', '')}`
    return { id, kind: 'package', title: pkg.name, description: pkg.manifest.description, category: 'Package APIs', url: `/reference/${id}`, source: `packages/${path.basename(pkg.directory)}/package.json`, sourceDigest: hash(JSON.stringify(pkg.manifest) + dependencies.join('\n')), language: 'en', aliases: [...new Set(aliases)], identifierAnchors, terms: [], rows: [], examples: [], related: ['rules/declarations', 'tools/mcp/mastercss_inspect_class'], markdown, headings: documentHeadings(markdown), extractionNotes: [] } satisfies ReferenceDocument
  })
}
