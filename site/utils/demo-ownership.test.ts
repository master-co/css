import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const site = new URL('../', import.meta.url)
const sitePath = fileURLToPath(site)

test('Guide MDX resolves demos from the site owner and shell has no demo imports', async () => {
  const shell = await readFile(new URL('docs-shell/components/markdown-components.ts', site), 'utf8')
  const shellFiles = await readdir(new URL('docs-shell/components/', site))
  assert.doesNotMatch(shell, /demoComponents|components\/demo/)
  const installation = await readFile(new URL('content/guide/installation/vite/content.mdx', site), 'utf8')
  assert.match(installation, /import InstallationPreview from '~\/site\/components\/demo\/DemoInstallation\.astro'/)
  for (const name of ['Demo', 'DemoPanel', 'DemoP', 'DemoLabel', 'DemoDark', 'DemoLight', 'IFrame', 'HelloWorld', 'BrowserHeader']) {
    assert.ok(!shellFiles.some(file => file.startsWith(`${name}.`)), `${name} still has a shell implementation`)
    assert.doesNotMatch(shell, new RegExp(`\\b${name}:`))
  }
})

test('site sources contain no retired demo imports, props or selectors', async () => {
  const retiredImport = /docs-shell\/components\/(?:Demo(?:Panel|P|Label|Dark|Light)?|IFrame|HelloWorld|BrowserHeader)(?:['"/]|\b)/
  const retiredProp = /<Demo\b[^>]*\$(?:px|py)\b/s
  const retiredStyle = /(?:\.demo(?![-\w])|\.demo-ground\b|\.app-demo\b|\.box-perspective-pink\b|var\(--stripe\))/
  for (const directory of ['content', 'components', 'docs-shell', 'styles']) {
    for (const relative of await readdir(path.join(sitePath, directory), { recursive: true })) {
      if (!/\.(?:astro|svelte|ts|mdx|css)$/.test(relative)) continue
      const source = await readFile(path.join(sitePath, directory, relative), 'utf8')
      assert.doesNotMatch(source, retiredImport, `${directory}/${relative} imports a retired demo`)
      assert.doesNotMatch(source, retiredProp, `${directory}/${relative} uses a retired Demo prop`)
      // Authored example CSS can use ordinary names such as .demo; shared presentation cannot revive retired UI selectors.
      if (directory !== 'content' && relative.endsWith('.css')) assert.doesNotMatch(source, retiredStyle, `${directory}/${relative} uses a retired demo selector`)
    }
  }
})
