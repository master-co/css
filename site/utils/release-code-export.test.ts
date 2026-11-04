import '../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const { extractReferenceMdx, portableMarkdown } = await import('../reference/markdown')

const fence = (language: string, source: string) => `\`\`\`${language}\n${source}\n\`\`\``

function preserveReleaseEnvironment() {
  const relevant = (key: string) => key.startsWith('PUBLIC_') || key === 'MASTER_CSS_PUBLIC_ENV_FILE'
  const previous = Object.fromEntries(Object.entries(process.env).filter(([key]) => relevant(key)))
  return () => {
    for (const key of Object.keys(process.env)) if (relevant(key)) delete process.env[key]
    Object.assign(process.env, previous)
  }
}

test('product MDX export projects the exact release through fences, literal Code and included MDX', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'master-css-release-export-'))
  const file = path.join(directory, 'content.mdx')
  const restoreEnvironment = preserveReleaseEnvironment()
  const unchanged = [
    'npm install @other/css@VERSION @master/literal@VERSION @master/css@rc @master/css@1.37.8',
    'npm install @master/css@VERSION-preview',
    '<script src="https://cdn.example/css-runtime@VERSION"></script>',
    'VERSION @sm 日本語 한국어 繁體 简体'
  ].join('\n')
  const literalHTML = '<script src="https://cdn.jsdelivr.net/npm/@master/css-runtime@VERSION/dist/index.min.js"></script>'

  try {
    delete process.env.MASTER_CSS_PUBLIC_ENV_FILE
    await writeFile(path.join(directory, 'included.mdx'), fence('bash', 'npm install @master/css-runtime@VERSION'))
    await writeFile(file, [
      'import Included from "./included.mdx"',
      '## Install \\{#installation\\}',
      fence('bash', 'npm create @master/css@VERSION -- --yes\nnpm install -D @master/css-cli@VERSION @master/eslint-config-css@VERSION'),
      fence('js', 'const compiler = "@master/css-compiler@VERSION"'),
      fence('html', '<script src="https://cdn.master.co/css-runtime@VERSION"></script>\n<link rel="stylesheet" href="https://cdn.master.co/css-preset@VERSION/src/base.css">'),
      `<Code lang="html">{${JSON.stringify(literalHTML)}}</Code>`,
      '<Included />',
      fence('text', unchanged)
    ].join('\n\n'))

    for (const version of ['2.0.0', '2.0.0-rc.89']) {
      await t.test(version, async () => {
        process.env.PUBLIC_VERSION = version
        const result = await extractReferenceMdx(file)
        assert.deepEqual(result.notes, [])
        assert.ok(result.markdown.includes(fence('bash', `npm create @master/css@${version} -- --yes\nnpm install -D @master/css-cli@${version} @master/eslint-config-css@${version}`)))
        assert.ok(result.markdown.includes(fence('js', `const compiler = "@master/css-compiler@${version}"`)))
        assert.ok(result.markdown.includes(fence('html', `<script src="https://cdn.master.co/css-runtime@${version}"></script>\n<link rel="stylesheet" href="https://cdn.master.co/css-preset@${version}/src/base.css">`)))
        assert.ok(result.markdown.includes(fence('html', `<script src="https://cdn.jsdelivr.net/npm/@master/css-runtime@${version}/dist/index.min.js"></script>`)))
        assert.ok(result.markdown.includes(fence('bash', `npm install @master/css-runtime@${version}`)))
        assert.ok(result.markdown.includes(fence('text', unchanged)))

        const portable = portableMarkdown(result.markdown)
        assert.ok(portable.includes('<a id="installation"></a>\n\n## Install'))
        assert.ok(portable.includes(fence('text', unchanged)))
        assert.ok(portable.includes(`https://cdn.master.co/css-runtime@${version}`))
      })
    }
  } finally {
    restoreEnvironment()
    await rm(directory, { recursive: true, force: true })
  }
})

test('product MDX export respects the configured public-env file over a stale process version', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'master-css-release-export-env-'))
  const file = path.join(directory, 'content.mdx')
  const envFile = path.join(directory, 'public-env.json')
  const alternateEnvFile = path.join(directory, 'alternate-public-env.json')
  const restoreEnvironment = preserveReleaseEnvironment()

  try {
    await writeFile(file, fence('bash', 'npm install @master/css@VERSION'))
    process.env.PUBLIC_VERSION = '2.0.0-rc.1'
    for (const [input, version] of [
      [envFile, '2.0.0'],
      [envFile, '2.0.0-rc.89'],
      [alternateEnvFile, '2.0.0'],
      [envFile, '2.0.0-rc.89']
    ]) {
      await writeFile(input, JSON.stringify({ PUBLIC_VERSION: version }))
      process.env.MASTER_CSS_PUBLIC_ENV_FILE = input
      const result = await extractReferenceMdx(file)
      assert.equal(result.markdown, fence('bash', `npm install @master/css@${version}`))
      assert.equal(process.env.PUBLIC_VERSION, '2.0.0-rc.1')
    }
  } finally {
    restoreEnvironment()
    await rm(directory, { recursive: true, force: true })
  }
})
