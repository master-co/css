import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const managed of [false, true]) {
  test.each(['static', 'runtime', 'pre-render', 'progressive'] as const)(`Sass URL build retains stylesheet identity with plugin=${managed}/%s`, async mode => {
    const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
    const root = mkdtempSync(join(parent, 'sass-url-build-'))
    try {
      mkdirSync(join(root, 'node_modules')); symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
      writeFileSync(join(root, 'style.scss'), '$layout:inline-flex;@import "./child.css" layer(guard);.local{display:$layout}')
      writeFileSync(join(root, 'child.css'), `.child{${managed ? '@compose p:2rem;' : 'padding:2rem;'}}`)
      writeFileSync(join(root, 'client.js'), 'import url from "./style.scss?url";const link=document.createElement("link");link.rel="stylesheet";link.href=url;document.head.append(link)')
      writeFileSync(join(root, 'index.html'), '<script type="module" src="./client.js"></script>')
      const result = await build({ root, configFile: false, logLevel: 'silent', plugins: managed ? masterCSS({ mode }) : [], build: { write: false, minify: false, cssMinify: false } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
      const css = result.output.filter(asset => asset.type === 'asset' && asset.fileName.endsWith('.css')).map(asset => asset.type === 'asset' ? String(asset.source) : '').join('\n')
      const js = result.output.filter(asset => asset.type === 'chunk').map(asset => asset.code).join('\n')
      expect(css).toMatch(/padding:\s*2rem/)
      expect(css).toContain('inline-flex')
      expect(css).not.toContain('@compose')
      expect(css).not.toContain('#master-css-local-')
      expect(js).not.toContain('__VITE_CSS_URL__')
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
}

for (const managed of [false, true]) {
  test(`Sass raw URL module retains authored source with plugin=${managed}`, async () => {
    const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
    const root = mkdtempSync(join(parent, 'sass-raw-build-'))
    try {
      const source = '$layout:inline-flex;.local{@compose p:2rem;display:$layout}'
      writeFileSync(join(root, 'style.scss'), source)
      writeFileSync(join(root, 'client.js'), 'import source from "./style.scss?raw";console.log(source)')
      writeFileSync(join(root, 'index.html'), '<script type="module" src="./client.js"></script>')
      const result = await build({ root, configFile: false, logLevel: 'silent', plugins: managed ? masterCSS({ mode: 'static' }) : [], build: { write: false, minify: false } })
      if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
      expect(result.output.filter(asset => asset.type === 'chunk').map(asset => asset.code).join('\n')).toContain(source)
    } finally { rmSync(root, { recursive: true, force: true }) }
  })
  for (const modules of [false, undefined]) {
    test.each(['css', 'scss'])(`Vite Modules URL limitation stays identical with plugin=${managed}/modules=${modules}/%s`, async extension => {
      const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
      const root = mkdtempSync(join(parent, 'modules-url-build-'))
      try {
        writeFileSync(join(root, `style.module.${extension}`), '.local{color:red}')
        writeFileSync(join(root, 'client.js'), `import url from "./style.module.${extension}?url";console.log(url)`)
        writeFileSync(join(root, 'index.html'), '<script type="module" src="./client.js"></script>')
        await expect(build({ root, configFile: false, logLevel: 'silent', css: { modules: modules as false | undefined }, plugins: managed ? masterCSS({ mode: 'static' }) : [], build: { write: false } })).rejects.toThrow('?url is not supported with CSS modules')
      } finally { rmSync(root, { recursive: true, force: true }) }
    })
  }
}
