import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const packagesDirectory = join(root, 'packages')
const sourceExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx'])
const ignoredDirectories = new Set([
  'dist',
  'e2e',
  'node_modules',
  'out',
  'tests',
  '.next',
  '.nuxt',
  '.output',
  '.svelte-kit',
  '.tsbuild'
])
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
  [/(?:fallback|fall back).{0,48}(?:TypeScript|TS semantic)/gi, 'TypeScript semantic fallback']
]

for (const file of await collectSourceFiles(packagesDirectory)) {
  const source = await readFile(file, 'utf8')
  for (const [pattern, description] of forbiddenSourcePatterns) {
    pattern.lastIndex = 0
    if (pattern.test(source)) failures.push(`${relative(root, file)}: ${description}`)
  }
}

const forbiddenDependencies = new Map([
  ['packages/compiler/package.json', new Set(['lightningcss', 'lightningcss-wasm', 'css-tree'])],
  ['packages/tooling/package.json', new Set(['oxc-parser', 'htmlparser2'])],
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
