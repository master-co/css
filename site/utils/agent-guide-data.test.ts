import assert from 'node:assert/strict'
import { test } from 'node:test'
import { agentPrompt, agentPromptMarkdown, resolveAgentPrompt } from './agent-guide-data'

for (const version of ['2.0.0', '2.0.0-rc.89']) for (const docsURL of ['https://css.master.co', 'https://rc.css.master.co']) {
  test(`agent prompts use ${version} and ${docsURL}`, () => {
    const options = { version, docsURL }
    const setup = resolveAgentPrompt(agentPrompt('setup'), options)
    assert.ok(setup.text.includes(`npx -y @master/css-mcp@${version} --root /absolute/path/to/project`))
    assert.ok(agentPromptMarkdown('setup', setup).includes(`@master/css-mcp@${version}`))
    assert.ok(resolveAgentPrompt(agentPrompt('context'), options).text.includes(`Documentation: ${docsURL}\n`))
    assert.ok(resolveAgentPrompt(agentPrompt('rules'), options).text.includes(`Read ${docsURL} and`))
    assert.ok(agentPrompt('setup').text.includes('@master/css-mcp@VERSION'))
    const install = resolveAgentPrompt(agentPrompt('install'), options).text
    assert.ok(install.includes('npm create @master/css@latest -- --yes --dry-run'))
    assert.ok(install.includes('npx @master/css-mcp --root'))
    assert.ok(install.includes(`See ${docsURL}/guide/rendering-modes.`))
    assert.ok(!install.includes(version) && !install.includes('VERSION'))
  })
}

test('agent projection preserves explicit pins, unrelated packages and lookalike documentation hosts', () => {
  const text = '@master/css-mcp@2.0.0-rc.1 @master/css-mcp@rc @other/mcp@VERSION @master/css-mcp@VERSION-preview\n'
    + 'https://css.master.co.evil.test https://docs.example.test https://rc.css.master.co/guide/ai-coding'
  const result = resolveAgentPrompt({ title: 'Preserved inputs', text }, { version: '2.0.0', docsURL: 'http://localhost:3117/a-path' })
  assert.equal(result.text, text.replace('https://rc.css.master.co/guide/', 'http://localhost:3117/guide/'))
})

test('agent projection rejects missing or non-version install values and non-HTTP documentation origins', () => {
  for (const version of ['', 'latest', 'rc', '2.0.0 --unsafe']) {
    assert.throws(() => resolveAgentPrompt(agentPrompt('setup'), { version, docsURL: 'https://css.master.co' }))
  }
  assert.throws(() => resolveAgentPrompt(agentPrompt('context'), { version: '2.0.0', docsURL: 'file:///tmp/docs' }))
})
