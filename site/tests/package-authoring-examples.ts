import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { loadProjectManifest } from '@master/css-compiler/project'
import { compileRenderedStylesheet } from '@master/css-compiler/stylesheet'
import preset from '../utils/preset-manifest'
import { authoringSource, authoringHTML } from '../utils/authoring-examples'
import { configuredMarkupClasses } from '../reference/configured-example'
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
    const fences = deliveryFences(deliverySource('authoring-packages').replaceAll('<package-name>', '@acme/ui-theme'))
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
    for (const text of ['--color-brand:#4f46e5', '&:hover', '&:focus-visible', '.content-auto{', 'prefers-reduced-motion:no-preference']) assert.ok(css.includes(text), text)
    assert.match(css, /\.btn\s*\{/)
    assert.doesNotMatch(css, /@compose|@custom-variant|@components|@utilities/)

    const local = fences.find(f => f.name === 'components/Button.module.css')!
    const compiled = await compileRenderedStylesheet(files.write(local.name, local.text), local.text, options)
    assert.deepEqual(compiled.diagnostics.filter(d => d.severity === 'error'), [])
    assert.match(compiled.css, /\.button\{content-visibility:auto;contain-intrinsic-size:auto 32rem\}/)
    assert.doesNotMatch(compiled.css, /\.btn\s*\{/)
    assert.doesNotMatch(compiled.css, /@reference|@compose/)

    // The documented relative-source alternative also works without a package resolver.
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
    files.write('index.css', '@theme { --color-primary: #123456; }')
    for (const fence of fences.filter(f => f.language === 'css')) files.write(fence.name, fence.text)
    files.write('projects/admin/package.json', JSON.stringify({ dependencies: { '@master/css': '*' } }))
    const root = join(files.root, 'projects/admin')
    const project = await loadProjectManifest({ root, baseManifest: preset })
    assert.equal(project.entries.length, 1)
    assert.ok(project.entries[0].endsWith('/projects/admin/index.css'))
    const rendered = await compileRenderedStylesheet(project.entries[0], readFileSync(project.entries[0], 'utf8'), { baseManifest: preset, projectDir: root, classes: ['bg-primary'] })
    assert.match(rendered.css, /--color-primary:#4f46e5/)
    assert.match(rendered.css, /\.app-shell\{/)
    assert.deepEqual(rendered.diagnostics.filter(d => d.severity === 'error'), [])
  } finally { files.dispose() }
}
