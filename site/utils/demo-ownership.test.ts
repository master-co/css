import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const site = new URL('../', import.meta.url)
const sitePath = fileURLToPath(site)

test('Guide MDX resolves demos from the site owner and shell has no demo imports', async () => {
  const provider = await readFile(new URL('mdx-components.tsx', site), 'utf8')
  const shell = await readFile(new URL('docs-shell/components/mdxComponents.tsx', site), 'utf8')
  const shellFiles = await readdir(new URL('docs-shell/components/', site))
  assert.match(provider, /\.\.\.demoComponents/)
  for (const [name, implementation] of Object.entries({
    BrowserHeader: 'DemoBrowserHeader', IFrame: 'DemoIFrame', HelloWorld: 'DemoHelloWorld'
  })) assert.match(provider, new RegExp(`${name}: demoComponents\\.${implementation}`))
  for (const name of ['Demo', 'DemoPanel', 'DemoP', 'DemoLabel', 'DemoDark', 'DemoLight', 'IFrame', 'HelloWorld', 'BrowserHeader']) {
    assert.ok(!shellFiles.includes(`${name}.tsx`), `${name} still has a shell implementation`)
    assert.doesNotMatch(shell, new RegExp(`\\b${name}:`))
  }
})

test('site sources contain no retired demo imports, props or selectors', async () => {
  const retiredImport = /docs-shell\/components\/(?:Demo(?:Panel|P|Label|Dark|Light)?|IFrame|HelloWorld|BrowserHeader)(?:['"/]|\b)/
  const retiredProp = /<Demo\b[^>]*\$(?:px|py)\b/s
  const retiredStyle = /(?:\.demo(?![-\w])|\.demo-ground\b|\.app-demo\b|\.box-perspective-pink\b|var\(--stripe\))/
  for (const directory of ['app', 'components', 'docs-shell', 'styles']) {
    for (const relative of await readdir(path.join(sitePath, directory), { recursive: true })) {
      if (!/\.(?:tsx|mdx|css)$/.test(relative)) continue
      const source = await readFile(path.join(sitePath, directory, relative), 'utf8')
      assert.doesNotMatch(source, retiredImport, `${directory}/${relative} imports a retired demo`)
      assert.doesNotMatch(source, retiredProp, `${directory}/${relative} uses a retired Demo prop`)
      if (relative.endsWith('.css')) assert.doesNotMatch(source, retiredStyle, `${directory}/${relative} uses a retired demo selector`)
    }
  }
})
