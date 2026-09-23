import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'

export interface ToolResult { content: { type: string, text?: string }[], isError?: boolean }
/** Exercise the documented stdio protocol with the repository's executable source. */
export async function connect(root: string) {
  const repo = fileURLToPath(new URL('../../', import.meta.url))
  const child = spawn(process.execPath, ['--import', 'tsx', 'packages/mcp/src/bin/index.ts', '--root', root], { cwd: repo, stdio: ['pipe', 'pipe', 'pipe'] })
  const pending = new Map<number, { resolve: (value: unknown) => void, reject: (error: Error) => void }>()
  let id = 0, buffer = '', stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk.toString() })
  const fail = (error: Error) => { for (const item of pending.values()) item.reject(error); pending.clear() }
  child.on('error', fail)
  child.on('exit', code => fail(new Error(`MCP process exited (${code}): ${stderr}`)))
  child.stdout.on('data', chunk => {
    buffer += chunk.toString()
    let end: number
    while ((end = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 1)
      if (!line.trim()) continue
      try {
        const message = JSON.parse(line)
        const request = pending.get(message.id)
        if (!request) continue
        pending.delete(message.id)
        if (message.error) request.reject(new Error(message.error.message))
        else request.resolve(message.result)
      } catch (error) { fail(error instanceof Error ? error : new Error(String(error))) }
    }
  })
  function request<T>(method: string, params: object = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const requestId = ++id
      const timeout = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method} timed out: ${stderr}`)) }, 15000)
      pending.set(requestId, {
        resolve: value => { clearTimeout(timeout); resolve(value as T) },
        reject: error => { clearTimeout(timeout); reject(error) }
      })
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n')
    })
  }
  async function close() {
    if (child.exitCode !== null || child.signalCode !== null) return
    const exit = once(child, 'exit')
    child.kill()
    await exit
  }
  try {
    await request('initialize', { protocolVersion: '2024-11-05', clientInfo: { name: 'site-docs-check', version: '1' }, capabilities: {} })
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
  } catch (error) { await close(); throw error }
  const call = (name: string, args: object = {}) => request<ToolResult>('tools/call', { name, arguments: args })
  return { request, call, close }
}
export function value<T>(result: ToolResult): T {
  assert.equal(result.isError, undefined, JSON.stringify(result.content))
  const text = result.content.find(item => item.type === 'text')?.text
  assert.ok(text, 'MCP JSON result')
  return JSON.parse(text) as T
}
export function errorText(result: ToolResult) {
  assert.equal(result.isError, true)
  return result.content.map(item => item.text ?? '').join('\n')
}
