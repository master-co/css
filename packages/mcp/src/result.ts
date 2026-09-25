import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'

export const MASTER_CSS_MCP_RESULT_VERSION = 3
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}

function normalizeResult(value: unknown) {
  const payload = record(value)
  const manifest = record(payload.manifest)
  const context = record(payload.context)
  const semantic = context.context ? context : manifest.context ? manifest : typeof payload.context === 'string' ? payload : {}
  const diagnostics = Array.isArray(payload.diagnostics) ? payload.diagnostics : []
  const failed = payload.status === 'error'
  const error = record(payload.error)
  return {
    version: MASTER_CSS_MCP_RESULT_VERSION,
    metadata: {
      versions: semantic.versions ?? null,
      context: semantic.context ?? (typeof payload.context === 'string' ? payload.context : null),
      manifestFingerprint: semantic.fingerprint ?? null,
      entries: semantic.entries ?? [],
      dependencies: semantic.dependencies ?? []
    },
    diagnostics,
    result: failed
      ? { status: 'error', error: { code: error.code ?? 'TOOL_EXECUTION_FAILED', message: error.message ?? 'Tool execution failed' } }
      : { status: 'success', data: value }
  }
}

export function toJSONText(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function jsonToolResult(value: unknown): CallToolResult {
  // Use the exact JSON representation for both transports, including omitted
  // optional fields. Neither path may silently discard dependencies or alternatives.
  const text = toJSONText(normalizeResult(value))
  const structuredContent = JSON.parse(text) as Record<string, unknown>
  return { structuredContent, content: [{ type: 'text', text }], ...(record(structuredContent.result).status === 'error' ? { isError: true } : {}) }
}

export function jsonResourceResult(uri: URL | string, value: unknown): ReadResourceResult {
  return { contents: [{ uri: String(uri), mimeType: 'application/json', text: toJSONText(normalizeResult(value)) }] }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function executeTool(operation: () => unknown | Promise<unknown>): Promise<CallToolResult> {
  try {
    return jsonToolResult(await operation())
  } catch (error) {
    const detail = record(error)
    const code = typeof detail.code === 'string' ? detail.code : 'TOOL_EXECUTION_FAILED'
    const message = getErrorMessage(error)
    return jsonToolResult({
      status: 'error', error: { code, message }, context: detail.context, manifest: detail.manifest,
      diagnostics: [{ code, phase: 'compiler', severity: 'error', message }, ...(Array.isArray(detail.diagnostics) ? detail.diagnostics : [])]
    })
  }
}
