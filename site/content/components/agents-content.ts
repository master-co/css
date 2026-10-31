/**
 * What the AI agents section shows the MCP server doing. Tool names and argument keys are the
 * ones `packages/mcp/src/server.ts` registers, and the results are what its handlers return for
 * `agentSession` in `home-content.ts`; `home-content.test.ts` checks both.
 */

/** The steps of the agent session, in order; each is one call to the MCP server. */
export const agentSessionStages = ['Manifest', 'Inspect', 'Lint', 'Preview', 'Apply'] as const

export type AgentSessionCallId = 'manifest' | 'inspect' | 'lint' | 'preview' | 'apply' | 'relint'

export interface AgentSessionCall {
  name: string
  /** The `arguments` of the `tools/call` request. */
  args: Record<string, string | string[]>
}

/** The confirmation token is 24 random bytes in base64url; any value of that shape is one the server could return. */
export const agentSessionConfirmToken = 'Vq3zK8tYp1mWc4LrN0aXhB7eFd2sUg6J'

export const agentSessionCalls: Record<AgentSessionCallId, AgentSessionCall> = {
  manifest: { name: 'mastercss_manifest_query', args: { kind: 'token', namespace: 'spacing' } },
  inspect: { name: 'mastercss_inspect_class', args: { className: 'bg-surface-raised' } },
  lint: { name: 'mastercss_lint_project', args: { patterns: ['plan-card.html'] } },
  preview: { name: 'mastercss_preview_fixes', args: { patterns: ['plan-card.html'] } },
  apply: { name: 'mastercss_apply_preview', args: { confirmToken: agentSessionConfirmToken } },
  relint: { name: 'mastercss_lint_project', args: { patterns: ['plan-card.html'] } }
}

/**
 * What the preview and apply steps report for the session's file: sha256 of the draft the preview
 * was made from (checked against the file on disk before writing) and of the fixed file, the lint
 * summary, and the preview lifetime the server uses unless `--preview-ttl` sets another.
 */
export const agentSessionResults = {
  beforeHash: '5a969adddf3f31c94ae383e9403693343e2a84267812546e768d6140fd10e0a1',
  afterHash: '4e0a1aab8f63b4435ad852e2f61c950fee505330f2c26d2fbaef34fd557ec9c0',
  lint: { diagnostics: 4, warnings: 4, fixable: 4 },
  relint: { diagnostics: 0, warnings: 0, fixable: 0 },
  previewMinutes: 5
} as const
