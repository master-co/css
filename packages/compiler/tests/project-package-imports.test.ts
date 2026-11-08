import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { loadProjectManifest } from '@master/css-compiler/project'
import { compileCSSManifestFile } from '../src/node-compiler'

const baseManifest = { version: 6, languageVersion: 18 } as const

/** A workspace app importing shared definitions by package specifier, as its build does. */
function workspace() {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-project-package-imports-')))
  const ui = join(root, 'packages/ui')
  const app = join(root, 'apps/web')
  mkdirSync(join(ui, 'src'), { recursive: true })
  mkdirSync(join(app, 'src'), { recursive: true })
  mkdirSync(join(app, 'node_modules/@acme'), { recursive: true })
  writeFileSync(join(ui, 'package.json'), JSON.stringify({ name: '@acme/ui', exports: { './master.css': './src/master.css' } }))
  writeFileSync(join(ui, 'src/master.css'), '@theme { --color-brand: #175cff; }\n@utility card { padding: 1rem; }\n')
  // Workspace packages are linked into node_modules by the package manager.
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'web', dependencies: { '@acme/ui': 'workspace:*' } }))
  symlinkSync(ui, join(app, 'node_modules/@acme/ui'), 'dir')
  const entry = join(app, 'src/app.css')
  writeFileSync(entry, '@import "@acme/ui/master.css";\n.page { color: var(--color-brand); }\n')
  return { root, entry, shared: join(ui, 'src/master.css') }
}

test('project manifests follow package specifier imports like the build delivery', async () => {
  const { root, entry, shared } = workspace()
  try {
    const dependencies: string[] = []
    const project = await loadProjectManifest({ root: join(root, 'apps/web'), entries: [entry], baseManifest, onDependency: file => dependencies.push(file) })
    expect(JSON.stringify(project.manifest)).toContain('color-brand')
    expect(project.manifest.utilities?.some(utility => utility.name === 'card')).toBe(true)
    // Editors and lint servers reload when the shared stylesheet changes.
    expect(dependencies.map(file => realpathSync.native(file))).toContain(shared)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('manifest file compilation follows package specifier imports', () => {
  const { root, entry } = workspace()
  try {
    const result = compileCSSManifestFile(entry, { baseManifest, root: join(root, 'apps/web') })
    expect(JSON.stringify(result.manifest)).toContain('color-brand')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
