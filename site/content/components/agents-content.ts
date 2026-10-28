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
  beforeHash: 'c238aec536b04fa1c8ad4543d54805b34000eeeb1f1f15905699d65b224f2a50',
  afterHash: 'ced444b5fb7d379fd6b49a77b98a00956604b994e47209b1494940dd3cde8cca',
  lint: { diagnostics: 4, warnings: 4, fixable: 4 },
  previewMinutes: 5
} as const
