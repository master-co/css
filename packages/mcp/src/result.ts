import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'

export function toJSONText(value: unknown) {
    return JSON.stringify(value, null, 2)
}

export function jsonToolResult(value: unknown): CallToolResult {
    return {
        content: [
            {
                type: 'text',
                text: toJSONText(value)
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
                text: toJSONText(value)
            }
        ]
    }
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error)
}
