import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'

export const MASTER_CSS_MCP_RESULT_VERSION = 2

function normalizeResult(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      diagnostics: [],
      ...value,
      version: MASTER_CSS_MCP_RESULT_VERSION
    }
  }
  return {
    version: MASTER_CSS_MCP_RESULT_VERSION,
    diagnostics: [],
    data: value
  }
}

export function toJSONText(value: unknown) {
  return JSON.stringify(value, null, 2)
}

export function jsonToolResult(value: unknown): CallToolResult {
  const structuredContent = normalizeResult(value)
  return {
    structuredContent,
    content: [
      {
        type: 'text',
        text: toJSONText(structuredContent)
      }
    ]
  }
}

export function jsonResourceResult(uri: URL | string, value: unknown): ReadResourceResult {
  return {
    contents: [
      {
        uri: String(uri),
        mimeType: 'application/json',
        text: toJSONText(normalizeResult(value))
      }
    ]
  }
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

export async function executeTool(operation: () => unknown | Promise<unknown>): Promise<CallToolResult> {
  try {
    return jsonToolResult(await operation())
  } catch (error) {
    const detail = error && typeof error === 'object' ? error as Record<string, unknown> : {}
    const diagnostic = {
      code: detail.code ?? 'TOOL_EXECUTION_FAILED', phase: 'compiler', severity: 'error',
      message: getErrorMessage(error)
    }
    return {
      ...jsonToolResult({
        status: 'error', context: detail.context, manifest: detail.manifest,
        diagnostics: [diagnostic, ...(Array.isArray(detail.diagnostics) ? detail.diagnostics : [])]
      }),
      isError: true
    }
  }
}
