import assert from 'node:assert/strict'
import { existsSync, globSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const packagesRoot = path.resolve('packages')
const textArtifactExtensions = new Set(['.js', '.mjs', '.cjs', '.ts', '.json'])
const nativeTargetPattern = /^@master\/css-native-(?:darwin|linux|win32)-/
const forbiddenSpecifierPattern = /@master\/(?:css-build-internal|css-(?:diagnostics|engine|integration|language|lexer|lint|project|scanner|source|stylesheet|validator)|css\.(?:astro|figma|next|nuxt|svelte|vite|webpack)|css-vs-code)(?=$|[/'"?\s])/g
const failures = []
let artifactCount = 0

function collectFiles(target) {
  if (!existsSync(target)) return []
  if (!statSync(target).isDirectory()) return [target]
  return readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(target, entry.name)
    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
}

function collectExportTargets(exports, targets = []) {
  if (typeof exports === 'string') {
    targets.push(exports)
  } else if (Array.isArray(exports)) {
    for (const value of exports) collectExportTargets(value, targets)
  } else if (exports && typeof exports === 'object') {
    for (const value of Object.values(exports)) collectExportTargets(value, targets)
  }
  return targets
}

for (const directory of readdirSync(packagesRoot)) {
  const packageRoot = path.join(packagesRoot, directory)
  const packageJSONPath = path.join(packageRoot, 'package.json')
  if (!existsSync(packageJSONPath)) continue

  const manifest = JSON.parse(readFileSync(packageJSONPath, 'utf8'))
  if (manifest.private) continue

  const exportTargets = [
    ...collectExportTargets(manifest.exports),
    manifest.types,
    manifest.style
  ].filter((target) => typeof target === 'string' && target.startsWith('./') && !target.includes('*'))

  for (const target of new Set(exportTargets)) {
    if (nativeTargetPattern.test(manifest.name)) continue
    if (!existsSync(path.resolve(packageRoot, target))) {
      failures.push(`${manifest.name}: exported artifact ${target} does not exist`)
    }
  }

  const excludedFiles = new Set((manifest.files ?? [])
    .filter((entry) => String(entry).startsWith('!'))
    .flatMap((entry) => globSync(String(entry).slice(1), { cwd: packageRoot }))
    .map((file) => path.join(packageRoot, file)))
  const publishedFiles = new Set((manifest.files ?? [])
    .filter((entry) => !String(entry).startsWith('!'))
    .flatMap((entry) => globSync(String(entry), { cwd: packageRoot }))
    .flatMap((target) => collectFiles(path.join(packageRoot, target))))

  for (const file of publishedFiles) {
    if (excludedFiles.has(file)) continue
    if (!textArtifactExtensions.has(path.extname(file))) continue
    artifactCount++
    const source = readFileSync(file, 'utf8')
    forbiddenSpecifierPattern.lastIndex = 0
    const match = forbiddenSpecifierPattern.exec(source)
    if (match) {
      failures.push(`${path.relative(process.cwd(), file)}: contains forbidden published specifier ${match[0]}`)
    }
  }
}

assert.equal(
  failures.length,
  0,
  `Published artifact contract violations:\n${failures.map((failure) => `- ${failure}`).join('\n')}`
)
process.stdout.write(`Validated ${artifactCount} published text artifact(s).\n`)
