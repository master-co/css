import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'

export const MASTER_CSS_MCP_RESULT_VERSION = 1

function normalizeResult(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      version: MASTER_CSS_MCP_RESULT_VERSION,
      diagnostics: [],
      ...value
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
  return {
    content: [
      {
        type: 'text',
        text: toJSONText(normalizeResult(value))
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
