import '../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

const { agentGuideContent } = await import('./agent-content')

test('actual agent exporter projects authoritative release metadata after localized demo copy', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'master-css-agent-release-'))
  const directory = path.join(root, 'content/guide/ai-coding')
  const envFile = path.join(root, 'public-env.json')
  const keys = ['PUBLIC_VERSION', 'PUBLIC_URL', 'MASTER_CSS_PUBLIC_ENV_FILE'] as const
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]))
  try {
    await mkdir(directory, { recursive: true })
    const body = '<AgentPrompt name="setup" />\n\n<AgentPrompt name="context" />\n\n<AgentPrompt name="rules" />\n'
    await writeFile(path.join(directory, 'content.mdx'), body)
    await writeFile(path.join(directory, 'content.tw.mdx'), `---\ntitle: "代理測試"\ndescription: "驗證版本與文件來源。"\ndemos: ${JSON.stringify({
      'AgentPrompt:setup': { title: '註冊本機伺服器', text: 'This must not replace the shared executable sample.' },
      'AgentPrompt:context': { title: '明確的樣式任務' },
      'AgentPrompt:rules': { title: '專案規則' }
    })}\n---\n\n${body}`)
    process.env.PUBLIC_VERSION = '2.0.0-rc.1'
    process.env.PUBLIC_URL = 'https://stale.example.test'
    process.env.MASTER_CSS_PUBLIC_ENV_FILE = envFile
    for (const version of ['2.0.0', '2.0.0-rc.89']) for (const docsURL of ['https://css.master.co', 'https://rc.css.master.co']) {
      await writeFile(envFile, JSON.stringify({ PUBLIC_VERSION: version, PUBLIC_URL: docsURL }))
      for (const locale of ['en', 'tw']) await t.test(`${locale} ${version} ${docsURL}`, async () => {
        const result = await agentGuideContent(root, 'ai-coding', locale)
        assert.deepEqual(result.notes, [])
        for (const output of [result.markdown, result.searchMarkdown]) {
          assert.ok(output.includes(`npx -y @master/css-mcp@${version} --root /absolute/path/to/project`))
          assert.ok(output.includes(`Documentation: ${docsURL}\n`))
          assert.ok(output.includes(`Read ${docsURL} and the project's existing styling conventions.`))
          assert.doesNotMatch(output, /@VERSION|@master\/css-mcp@rc\s|stale\.example\.test|This must not replace/)
          assert.ok(output.includes(locale === 'tw' ? '註冊本機伺服器' : 'Register the local server'))
        }
      })
    }
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
    await rm(root, { recursive: true, force: true })
  }
})
