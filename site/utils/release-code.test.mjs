import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { releaseCode, releaseCodeMdx } from './release-code.mjs'

test('installer, CLI, MCP and CDN examples all resolve to the same exact release', () => {
  const source = [
    'npm create @master/css@VERSION -- --yes',
    'npm install -D @master/css-cli@VERSION @master/eslint-config-css@VERSION',
    '"args": ["@master/css-mcp@VERSION"]',
    'https://cdn.master.co/css-runtime@VERSION',
    'https://cdn.master.co/css-preset@VERSION/src/base.css',
    'https://cdn.jsdelivr.net/npm/@master/css-runtime@VERSION/dist/default-program.bin'
  ].join('\n')
  for (const version of ['2.0.0', '2.0.0-rc.89']) {
    assert.equal(releaseCode(source, version), source.replaceAll('@VERSION', '@' + version))
  }
})

test('preserves source examples, real pinned versions, unrelated packages and language text', () => {
  const source = 'VERSION @sm @master/css@rc @master/css@1.37.8 @master/css@VERSION-preview @master/css@VERSION.old @other/css@VERSION @master/literal@VERSION\n日本語 한국어 繁體 简体'
  assert.equal(releaseCode(source, '2.0.0'), source)
  for (const version of ['latest', 'rc', '', '2.0.0\n<script>', undefined]) {
    assert.throws(() => releaseCode('npm create @master/css@VERSION', version))
  }
})

test('MDX render and Markdown export share the exact projection without changing anchors', () => {
  const root = resolve('/tmp/master-css-release-site')
  const plugin = releaseCodeMdx({ siteRoot: root, version: '2.0.0' })
  const body = '## Install \\{#installation\\}\n\n```bash\nnpm create @master/css@VERSION -- --yes\n```\n'
  for (const locale of ['en', 'tw', 'ja', 'ko', 'cn']) {
    const filename = locale === 'en' ? 'content.mdx' : `content.${locale}.mdx`
    assert.equal(plugin.transform(body, resolve(root, 'content/guide/installation', filename)).code, releaseCode(body, '2.0.0'))
  }
})

test('preprocessor only changes product MDX with an explicit release placeholder', () => {
  const root = resolve('/tmp/master-css-release-site')
  const plugin = releaseCodeMdx({ siteRoot: root, version: '2.0.0' })
  const body = 'npm create @master/css@VERSION'
  assert.equal(plugin.enforce, 'pre')
  assert.equal(plugin.transform(body, resolve(root, 'content.mdx') + '?raw').code, 'npm create @master/css@2.0.0')
  for (const id of [resolve(root, '../other/content.mdx'), resolve(root + '-other', 'content.mdx'), resolve(root, 'example.ts'), '\0virtual.mdx']) {
    assert.equal(plugin.transform(body, id), undefined)
  }
  assert.equal(plugin.transform('No release placeholder', resolve(root, 'content.mdx')), undefined)
})
