import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const packagesDirectory = join(root, 'packages')
const sourceExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx'])
const ignoredDirectories = new Set(['dist', 'e2e', 'node_modules', 'tests', '.tsbuild'])
const failures = []

async function collectSourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collectSourceFiles(path))
    else if (sourceExtensions.has(extname(entry.name)) && !entry.name.endsWith('.d.ts')) files.push(path)
  }
  return files
}

const forbiddenSourcePatterns = [
  [/\bnew\s+MasterCSS\s*\(/g, 'legacy MasterCSS construction'],
  [/\bMasterCSS\.create\s*\(/g, 'legacy MasterCSS factory'],
  [/@master\/css-engine\/(?:compiler|core|inspect|layer|rule|utility)/g, 'legacy engine implementation import'],
  [/@master\/css-compiler\/(?:core|lower-css-directives|master-css-manifest)/g, 'legacy compiler implementation import'],
  [/(?:fallback|fall back).{0,48}(?:TypeScript|TS semantic)/gi, 'TypeScript semantic fallback']
]

for (const file of await collectSourceFiles(packagesDirectory)) {
  const source = await readFile(file, 'utf8')
  for (const [pattern, description] of forbiddenSourcePatterns) {
    pattern.lastIndex = 0
    if (pattern.test(source)) failures.push(`${relative(root, file)}: ${description}`)
  }

  if (!file.includes(`${join('packages', 'language')}/`)) {
    const lexerImports = [...source.matchAll(/from\s+['"](@master\/css-lexer(?:\/[^'"]+)?)['"]/g)]
    for (const [, specifier] of lexerImports) {
      if (specifier === '@master/css-lexer/shiki') {
        failures.push(`${relative(root, file)}: Shiki-only TypeScript lexer imported outside @master/css-language`)
      }
    }
  }
}

const removedSemanticFiles = [
  'packages/engine/src/core.ts',
  'packages/engine/src/compiler.ts',
  'packages/engine/src/inspect.ts',
  'packages/compiler/src/core.ts',
  'packages/compiler/src/lower-css-directives.ts',
  'packages/compiler/src/master-css-manifest.ts',
  'packages/lint/src/find-class-conflicts.ts',
  'packages/lint/src/sort-class-names.ts',
  'packages/language/src/format-directives.ts'
]

const existingFiles = new Set(await collectSourceFiles(packagesDirectory))
for (const path of removedSemanticFiles) {
  if (existingFiles.has(join(root, path))) failures.push(`${path}: removed TypeScript semantic core was restored`)
}

const forbiddenDependencies = new Map([
  ['packages/compiler/package.json', new Set(['lightningcss', 'lightningcss-wasm', 'css-tree'])],
  ['packages/source/package.json', new Set(['oxc-parser', 'htmlparser2'])],
  ['packages/language/package.json', new Set(['oxc-parser'])],
  ['packages/vscode/package.json', new Set(['lightningcss', 'lightningcss-wasm', 'oxc-parser'])]
])

for (const [manifestPath, forbidden] of forbiddenDependencies) {
  const manifest = JSON.parse(await readFile(join(root, manifestPath), 'utf8'))
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
    ...manifest.peerDependencies
  }
  for (const dependency of forbidden) {
    if (dependency in dependencies) failures.push(`${manifestPath}: forbidden semantic dependency ${dependency}`)
  }
}

if (failures.length) {
  console.error('Rust core boundary violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'))
  process.exitCode = 1
} else {
  console.log('Rust core boundaries verified.')
}
