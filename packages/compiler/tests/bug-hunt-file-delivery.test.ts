import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { expect, test } from 'vitest'
import { compileManifestFileSync } from '../src/node'

for (const condition of ['layer(shared)', 'layer', 'supports(display:grid) print']) {
  test(`BH-0004 public file delivery preserves ${condition} with nested external imports`, () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-file-delivery-'))
    try {
      const entry = join(root, 'entry.css'), child = join(root, 'child.css'), tokens = join(root, 'tokens.css')
      writeFileSync(entry, `@import './child.css' ${condition};@reference './tokens.css';@utilities{button{@compose paint;}}.example{color:green}`)
      writeFileSync(child, "@import 'https://remote.test/external.css';@reference './tokens.css';.example{@compose paint;}")
      writeFileSync(tokens, '@utilities{paint{color:red}}.reference-only{color:blue}')
      const options = {
        root, baseManifest: { version: 1 as const, languageVersion: 3 as const, utilities: [] }, preserveNativeCSS: true,
        delivery: { entryURL: '/output/main.css', stylesheetURL: (file: string) => `/output/${basename(file)}`, resourceURL: (file: string) => `/output/${basename(file)}` }
      }
      const result = compileManifestFileSync(entry, options)
      expect(result.css.replace(/\s+/g, '')).toContain(condition.replace(/\s+/g, ''))
      expect(result.dependencies).toEqual(expect.arrayContaining([entry, child, tokens]))
      expect(result).toHaveProperty('stylesheets')
      const assets = result.stylesheets
      expect(assets.find(asset => asset.id === entry)?.href).toBe('/output/main.css')
      expect(assets.find(asset => asset.id === child)?.css).toContain('.example{color:red}')
      expect(assets.find(asset => asset.id === child)?.css).toContain('https://remote.test/external.css')
      expect(assets.some(asset => asset.id === tokens)).toBe(false)
      expect(JSON.stringify(result.manifest)).toContain('button')
      expect(JSON.stringify(result.manifest)).not.toContain('paint')
      expect(existsSync(join(root, 'output'))).toBe(false)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}


for (const preserveNativeCSS of [undefined, true]) {
  test(`BH-0004 file assets retain native compose with preserveNativeCSS=${preserveNativeCSS}`, () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-file-compose-'))
    try {
      mkdirSync(join(root, 'styles'))
      const entry = join(root, 'entry.css'), child = join(root, 'styles/child.css'), tokens = join(root, 'styles/tokens.css'), resource = join(root, 'styles/pixel.svg')
      writeFileSync(entry, "@import './styles/child.css' print;")
      writeFileSync(child, "@reference './tokens.css';.example{@compose paint;}.raw{color:blue}")
      writeFileSync(tokens, "@utilities{paint{color:red;background-image:url('./pixel.svg?version=1#icon')}}")
      writeFileSync(resource, '<svg xmlns="http://www.w3.org/2000/svg"/>')
      const result = compileManifestFileSync('entry.css', {
        root, preserveNativeCSS, baseManifest: { version: 1, languageVersion: 3, utilities: [] },
        delivery: { entryURL: '/published/main.css', stylesheetURL: file => `/published/${basename(file)}`, resourceURL: file => `/media/${basename(file)}` }
      })
      const css = result.stylesheets.find(asset => asset.id === child)!.css
      expect(css).toContain('.example{')
      expect(css).toContain('color:red')
      expect(css).toContain('/media/pixel.svg?version=1#icon')
      expect(css).toContain('.raw')
      expect(result.css).toContain('print')
      expect(result.stylesheets.find(asset => asset.id === child)!.generatedCSS).toContain('.example{')
      expect(result.resources).toEqual([{ file: resource, href: '/media/pixel.svg' }])
      expect(result.dependencies).toEqual(expect.arrayContaining([entry, child, tokens, resource]))
      expect(Object.isFrozen(result) && Object.isFrozen(result.stylesheets) && Object.isFrozen(result.stylesheets[0]) && Object.isFrozen(result.resources[0])).toBe(true)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}

test('BH-0004 file delivery rejects missing resources and URL collisions before publication', () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-file-errors-'))
  try {
    const entry = join(root, 'entry.css'), child = join(root, 'child.css'), resource = join(root, 'missing.svg')
    writeFileSync(entry, "@import './child.css';")
    writeFileSync(child, ".example{background:url('./missing.svg')}")
    const dependencies: string[] = []
    const options = { root, baseManifest: { version: 1 as const, languageVersion: 3 as const, utilities: [] }, delivery: {
      entryURL: '/entry.css', stylesheetURL: () => '/entry.css', resourceURL: () => '/resource.svg', onDependency: (file: string) => dependencies.push(file)
    } }
    expect(() => compileManifestFileSync(entry, options)).toThrow(/missing\.svg/)
    expect(dependencies).toContain(resource)
    writeFileSync(resource, '<svg/>')
    expect(() => compileManifestFileSync(entry, options)).toThrow(/distinct delivery URL/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
