import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { fixMasterCSSContent, lintMasterCSSContent, resolveMasterCSSLintRules, summarizeMasterCSSLintFiles } from '@master/css-tooling/lint'
import { createToolingSessionSync } from '@master/css-tooling/node'
import preset from '../../utils/preset-manifest'
import { agentSessionCalls, agentSessionResults } from './agents-content'
import { agentSession } from './home-content'

const server = readFileSync(new URL('../../../packages/mcp/src/server.ts', import.meta.url), 'utf8')
const context = readFileSync(new URL('../../../packages/mcp/src/context.ts', import.meta.url), 'utf8')

/** The source that registers one MCP tool, from its name to the next registration. */
function toolRegistration(name: string) {
  const start = server.indexOf(`'${name}',`)
  assert.ok(start >= 0, `${name} is registered`)
  const end = server.indexOf('server.registerTool(', start)
  return server.slice(start, end < 0 ? undefined : end)
}

test('the agent session calls registered MCP tools with arguments they accept', () => {
  for (const call of Object.values(agentSessionCalls)) {
    const registration = toolRegistration(call.name)
    for (const key of Object.keys(call.args)) assert.match(registration, new RegExp(`\\b${key}: z\\.`), `${call.name} accepts ${key}`)
  }
})

test('the agent session shows what the MCP server reports for its file', () => {
  const lintSession = createToolingSessionSync({ manifest: preset as unknown as MasterCSSManifest })
  try {
    // The file the agent wrote, as the server reads it from disk.
    const content = agentSession.code.trimStart()
    // The rules the server applies when a call names none.
    const rules = resolveMasterCSSLintRules(undefined)
    const file = lintMasterCSSContent({ content, filePath: agentSession.file, rules, lintSession })
    const { diagnostics, warnings, fixable } = summarizeMasterCSSLintFiles([file])
    assert.deepEqual({ diagnostics, warnings, fixable }, agentSessionResults.lint)
    const fixed = fixMasterCSSContent({ content, filePath: agentSession.file, rules, lintSession })
    assert.equal(fixed, agentSession.fixedCode.trimStart())
    const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')
    assert.equal(sha256(content), agentSessionResults.beforeHash)
    assert.equal(sha256(fixed), agentSessionResults.afterHash)
    // Before the agent styles it, the card is the same markup without class attributes, with nothing to lint;
    // the edit adds an attribute to three lines.
    const plain = content.replace(/ class="[^"]*"/g, '')
    assert.deepEqual(lintMasterCSSContent({ content: plain, filePath: agentSession.file, rules, lintSession }).diagnostics, [])
    assert.equal(content.split('\n').filter((line, index) => line !== plain.split('\n')[index]).length, 3)
  } finally {
    lintSession.dispose()
  }
  // 24 random bytes in base64url, and the server's default preview lifetime.
  assert.match(agentSessionCalls.apply.args.confirmToken as string, /^[\w-]{32}$/)
  assert.match(context, new RegExp(`DEFAULT_PREVIEW_TTL = ${agentSessionResults.previewMinutes} \\* 60 \\* 1000`))
})
