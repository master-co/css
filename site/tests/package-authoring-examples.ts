import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { loadProjectManifest } from '@master/css-compiler/project'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import preset from '@master/internal-site/css/preset-manifest.ts'
import { authoringSource, authoringHTML } from '../utils/authoring-examples'
import { configuredMarkupClasses } from '@master/internal-site/css/configured-example.ts'
import { deliveryFences, deliverySource, siteRoot } from './delivery-examples'

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'master-package-authoring-'))
  // Own node_modules: the sample package must never be written into site dependencies.
  mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
  symlinkSync(join(siteRoot, 'node_modules/@master/css'), join(root, 'node_modules/@master/css'), 'dir')
  return {
    root,
    write(name: string, source: string) {
      const file = join(root, name)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, source)
      return file
    },
    dispose() { rmSync(root, { recursive: true, force: true }) }
  }
}

export async function verifyPackageAuthoringExamples() {
  const files = fixture()
  try {
    const fences = deliveryFences(deliverySource('authoring-packages'))
    files.write('node_modules/@acme/ui-theme/package.json', fences.find(f => f.name === 'package.json')!.text)
    const packageFile = files.write('node_modules/@acme/ui-theme/master.css', authoringSource)
    const entry = files.write('app.css', fences.find(f => f.name === 'app.css')!.text)
    files.write('index.html', authoringHTML)
    const classes = configuredMarkupClasses(authoringHTML)
    const options = {
      baseManifest: preset, projectDir: files.root, preserveNativeCSS: true,
      delivery: {
        entryURL: '/styles/app.css', resolveNodePackageImports: true,
        stylesheetURL: (file: string, variant?: string) => `/styles/${Buffer.from(file + (variant ?? '')).toString('base64url')}.css`,
        resourceURL: (file: string) => `/assets/${Buffer.from(file).toString('base64url')}`
      }
    }
    const result = await compileRenderedStylesheet(entry, readFileSync(entry, 'utf8'), { ...options, classes })
    assert.deepEqual(result.diagnostics.filter(d => d.severity === 'error'), [])
    assert.ok(result.dependencies.some(p => p.endsWith('/@acme/ui-theme/master.css')), packageFile)
    const css = result.stylesheets!.map(sheet => sheet.css).join('\n')
    for (const text of ['--color-brand:#4f46e5', '&:hover', '&:focus-visible', '.content-auto{', 'prefers-reduced-motion: no-preference']) assert.ok(css.includes(text), text)
    assert.match(css, /\.btn\s*\{/)
    assert.match(css, /--color-focus-action:\s*var\(--color-text-strong\)/)
    assert.match(css, /outline:\s*2px solid var\(--color-focus-action\)/)
    assert.doesNotMatch(css, /@compose|@custom-variant|@components|@utilities/)

    const local = fences.find(f => f.name === 'components/Button.module.css')!
    const compiled = await compileRenderedStylesheet(files.write(local.name, local.text), local.text, options)
    assert.deepEqual(compiled.diagnostics.filter(d => d.severity === 'error'), [])
    assert.match(compiled.css, /padding-inline:\s*var\(--spacing-action-x\)/)
    assert.match(compiled.css, /border-radius:\s*var\(--radius-action\)/)
    assert.match(compiled.css, /background-color:\s*var\(--color-brand\)/)
    assert.match(compiled.css, /--spacing-action-x:\s*1rem/)
    assert.match(compiled.css, /--radius-action:\s*0?\.375rem/)
    assert.match(compiled.css, /--color-brand:\s*#4f46e5/)
    assert.doesNotMatch(compiled.css, /\.btn\s*\{/)
    assert.doesNotMatch(compiled.css, /@reference|@compose/)

    // The illustration's App A does not request the on-demand utility.
    const minimal = await compileRenderedStylesheet(entry, readFileSync(entry, 'utf8'), { ...options, classes: ['btn'] })
    const minimalCSS = minimal.stylesheets!.map(sheet => sheet.css).join('\n')
    assert.deepEqual(minimal.diagnostics.filter(d => d.severity === 'error'), [])
    assert.match(minimalCSS, /\.btn\s*\{/)
    assert.doesNotMatch(minimalCSS, /\.content-auto\s*\{/)

    const override = fences.filter(f => f.name === 'app.css')[1]!
    const customized = await compileRenderedStylesheet(entry, override.text, { ...options, classes })
    const customizedCSS = customized.stylesheets!.map(sheet => sheet.css).join('\n')
    assert.deepEqual(customized.diagnostics.filter(d => d.severity === 'error'), [])
    assert.match(customizedCSS, /--spacing-action-x:\s*1.5rem/)
    assert.match(customizedCSS, /padding:\s*\.5rem var\(--spacing-action-x\)/)

    // A relative-source import also works without a package resolver.
    files.write('shared/master.css', authoringSource)
    files.write('app.css', "@import '@master/css';\n@import './shared/master.css';")
    const project = await loadProjectManifest({ root: files.root, baseManifest: preset })
    const rendered = await compileRenderedStylesheet(project.entries[0], readFileSync(project.entries[0], 'utf8'), { baseManifest: preset, projectDir: files.root, classes })
    assert.match(rendered.css, /\.btn\s*\{/)
    assert.deepEqual(rendered.diagnostics.filter(d => d.severity === 'error'), [])
  } finally { files.dispose() }
}

export async function verifyMonorepoExamples() {
  const files = fixture()
  try {
    const fences = deliveryFences(deliverySource('monorepo'))
    for (const fence of fences.filter(f => f.language === 'css')) files.write(fence.name, fence.text)
    for (const [app, color, otherColor] of [['admin', '#4f46e5', '#0f766e'], ['shop', '#0f766e', '#4f46e5']]) {
      files.write(`projects/${app}/package.json`, JSON.stringify({ dependencies: { '@master/css': '*' } }))
      const root = join(files.root, `projects/${app}`)
      const project = await loadProjectManifest({ root, baseManifest: preset })
      assert.equal(project.entries.length, 1)
      assert.ok(project.entries[0].endsWith(`/projects/${app}/index.css`))
      const rendered = await compileRenderedStylesheet(project.entries[0], readFileSync(project.entries[0], 'utf8'), { baseManifest: preset, projectDir: root, classes: ['bg-primary'] })
      assert.ok(rendered.css.includes(`--color-primary:${color}`), `${app}: its own token override`)
      assert.ok(!rendered.css.includes(otherColor), `${app}: another app's override must not leak`)
      assert.match(rendered.css, /background-color:var\(--color-primary\)/)
      if (app === 'admin') assert.match(rendered.css, /\.app-shell\s*\{[^}]*background-color:\s*var\(--color-surface-base\)/)
      assert.deepEqual(rendered.diagnostics.filter(d => d.severity === 'error'), [])
    }
  } finally { files.dispose() }
}
