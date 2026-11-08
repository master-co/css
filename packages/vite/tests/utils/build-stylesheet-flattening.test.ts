import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, posix } from 'node:path'
import { build } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

async function buildCSS(files: Record<string, string>) {
  const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
  const root = realpathSync(mkdtempSync(join(parent, 'flattening-')))
  try {
    for (const [file, source] of Object.entries(files)) {
      mkdirSync(dirname(join(root, file)), { recursive: true })
      writeFileSync(join(root, file), source)
    }
    const result = await build({ root, configFile: false, logLevel: 'silent', plugins: masterCSS({ mode: 'static' }), build: { write: false, cssMinify: false } })
    if (Array.isArray(result) || 'on' in result) throw new Error('Expected one build output')
    return new Map(result.output.filter(asset => asset.type === 'asset').map(asset => [asset.fileName, String(asset.source)]))
  } finally { rmSync(root, { recursive: true, force: true }) }
}

const page = '<main></main><script type="module" src="/src/main.ts"></script>'
const main = 'import "./app.css";document.body.className = "after (display:block)"'
// An explicit source keeps scanning independent of ignore rules above the temporary root.
const source = '@source "./main.ts";'

function expectOrdered(css: string, markers: string[]) {
  const positions = markers.map(marker => css.indexOf(marker))
  expect(markers.filter((_, index) => positions[index] < 0), css).toEqual([])
  expect(positions).toEqual([...positions].sort((a, b) => a - b))
}

test('static production builds flatten same-build imports into the CSS entry', async () => {
  const output = await buildCSS({
    'index.html': page,
    'src/main.ts': main,
    'src/app.css': `@layer reset, app;@import "@master/css";@import './styles/base.css' layer(reset);@import './styles/print.css' print;@import './styles/empty.css';${source}.after{color:green}`,
    'src/styles/base.css': "@import './nested.css';.base{background-image:url('../image.svg')}",
    'src/styles/nested.css': '.nested{color:blue}',
    'src/styles/print.css': '.print{color:black}',
    'src/styles/empty.css': '',
    'src/image.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>'
  })
  const stylesheets = [...output.keys()].filter(file => file.endsWith('.css'))
  expect(stylesheets).toEqual([expect.stringMatching(/^assets\/index-[\w-]+\.css$/)])
  const css = output.get(stylesheets[0])!
  expect(css).not.toContain('@import')
  const resource = [...output.keys()].find(file => file.endsWith('.svg'))!
  expect(resource).toMatch(/^assets\/master-css-resource-/)
  // Layer statements, layer and media wrappers, and generated rules keep their cascade positions.
  expectOrdered(css, ['@layer reset, app;', '@layer base', '@layer reset{', '.nested', '.base', `url("./${posix.basename(resource)}")`, '@media print', '.print', '.after', '.\\(display\\:block\\)'])
})

test('static production builds publish only nonempty stylesheets that retained boundaries import', async () => {
  const output = await buildCSS({
    'index.html': page,
    'src/main.ts': main,
    'src/app.css': `@import "@master/css";@import './remote.css';${source}.after{color:green}`,
    // An external import cannot follow inlined rules, so this child keeps its boundary.
    'src/remote.css': "@import 'https://remote.test/font.css';.remote{color:red}"
  })
  const stylesheets = [...output.keys()].filter(file => file.endsWith('.css'))
  const entry = stylesheets.find(file => /^assets\/index-/.test(file))!
  const visited = new Set<string>()
  const expand = (file: string): string => {
    visited.add(file)
    const css = output.get(file)!
    expect(css.trim(), file).not.toBe('')
    return css.replace(/@import "\.\/([^"]+)";/g, (_, href: string) => expand(posix.join(posix.dirname(file), href)))
  }
  const css = expand(entry)
  expect([...visited].sort()).toEqual([...stylesheets].sort())
  expectOrdered(css, ['@layer base', '@import "https://remote.test/font.css";', '.remote', '.after', '.\\(display\\:block\\)'])
})

test('static production builds move a leading external import of the CSS entry into the single CSS asset', async () => {
  const output = await buildCSS({
    'index.html': page,
    'src/main.ts': main,
    'src/app.css': `@import url(https://remote.test/a.css);@import "@master/css";${source}.x{color:green}`
  })
  const stylesheets = [...output.keys()].filter(file => file.endsWith('.css'))
  expect(stylesheets).toEqual([expect.stringMatching(/^assets\/index-[\w-]+\.css$/)])
  const css = output.get(stylesheets[0])!
  expect(css.match(/@import/g)).toHaveLength(1)
  expectOrdered(css, ['@import', 'https://remote.test/a.css', '@layer theme', '.x', '.\\(display\\:block\\)'])
})
