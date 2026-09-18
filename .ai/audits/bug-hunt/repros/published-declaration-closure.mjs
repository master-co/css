import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript6'

const root = fileURLToPath(new URL('../../../../', import.meta.url))
const packages = [], options = {
  module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
  resolveJsonModule: true, allowJs: false
}
function typeTargets(value, targets) {
  if (!value || typeof value !== 'object') return
  for (const [key, target] of Object.entries(value)) {
    if (key === 'types' && typeof target === 'string') targets.add(target)
    else if (typeof target === 'object') typeTargets(target, targets)
  }
}
for (const directory of readdirSync(resolve(root, 'packages')).sort()) {
  const packageRoot = resolve(root, 'packages', directory), manifestFile = resolve(packageRoot, 'package.json')
  if (!existsSync(manifestFile)) continue
  const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
  const targets = new Set(typeof manifest.types === 'string' ? [manifest.types] : [])
  typeTargets(manifest.exports, targets)
  if (!targets.size) continue
  const pending = [...targets].map(file => resolve(packageRoot, file)), visited = new Set(), issues = []
  while (pending.length) {
    const file = pending.pop()
    if (visited.has(file)) continue
    visited.add(file)
    if (!existsSync(file)) { issues.push({ file: relative(root, file), kind: 'missing-entry' }); continue }
    const source = readFileSync(file, 'utf8')
    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      const specifier = imported.fileName
      if (!specifier.startsWith('.')) continue
      const module = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule
      const resolved = module?.resolvedFileName
      if (!resolved || (!/\.d\.[cm]?ts$|\.json$/.test(resolved))) {
        issues.push({ file: relative(root, file), specifier, kind: resolved ? 'javascript-without-declaration' : 'unresolved-relative',
          resolved: resolved ? relative(root, resolved) : relative(root, resolve(dirname(file), specifier)) })
      } else if (!relative(packageRoot, resolved).startsWith('..')) pending.push(resolved)
    }
  }
  packages.push({ name: manifest.name, directory: relative(root, packageRoot), entries: [...targets], inspected: visited.size, issues })
}
console.log(JSON.stringify({ packages, affected: packages.filter(pkg => pkg.issues.length).map(pkg => pkg.name),
  scope: 'Read-only current published type entrypoints andrelative declaration closure. Missing currentartifacts alone do notprove afresh-build productbug;bareexternaldependency validation is separate.' }, null, 2))
