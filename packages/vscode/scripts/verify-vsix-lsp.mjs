import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'

/** Exercise the server from the extracted archive, without checkout resolution. */
export async function verifyLanguageServer(serverPath, cwd, env) {
  const child = spawn(process.execPath, [serverPath, '--stdio'], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
  const closed = once(child, 'close')
  let buffer = Buffer.alloc(0), nextId = 0, stderr = ''
  const pending = new Map()
  const send = message => {
    const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }))
    child.stdin.write(Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`), body]))
  }
  const request = (method, params) => new Promise((resolve, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => reject(new Error(`${method} timed out\n${stderr}`)), 45_000)
    pending.set(id, { resolve, reject, timer })
    send({ id, method, params })
  })
  child.stderr.on('data', chunk => { stderr += chunk })
  child.stdout.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk])
    while (true) {
      const end = buffer.indexOf('\r\n\r\n')
      if (end < 0) return
      const length = Number(/Content-Length: (\d+)/i.exec(buffer.subarray(0, end).toString())?.[1])
      if (!Number.isFinite(length)) { child.kill(); return }
      if (buffer.length < end + 4 + length) return
      const message = JSON.parse(buffer.subarray(end + 4, end + 4 + length).toString())
      buffer = buffer.subarray(end + 4 + length)
      if (pending.has(message.id)) {
        const item = pending.get(message.id)
        clearTimeout(item.timer)
        pending.delete(message.id)
        if (message.error) item.reject(new Error(JSON.stringify(message.error)))
        else item.resolve(message.result)
      }
    }
  })
  const rejectPending = error => {
    for (const item of pending.values()) { clearTimeout(item.timer); item.reject(error) }
    pending.clear()
  }
  child.on('error', rejectPending)
  child.on('close', code => rejectPending(new Error(`Server exited ${code}\n${stderr}`)))
  try {
    const initialized = await request('initialize', { processId: null, rootUri: null, capabilities: {}, workspaceFolders: [] })
    assert.equal(initialized.capabilities.hoverProvider, true)
    send({ method: 'initialized', params: {} })
    const uri = 'untitled:vsix-verification.html'
    const text = '<div class="block block:"></div>'
    send({ method: 'textDocument/didOpen', params: { textDocument: { uri, languageId: 'html', version: 1, text } } })
    const completion = await request('textDocument/completion', {
      textDocument: { uri }, position: { line: 0, character: text.indexOf('block:') + 6 },
      context: { triggerKind: 2, triggerCharacter: ':' }
    })
    assert.ok((completion.items ?? completion).some(item => item.label === ':first-child'))
    const hover = await request('textDocument/hover', { textDocument: { uri }, position: { line: 0, character: text.indexOf('block') + 2 } })
    assert.match(JSON.stringify(hover), /display[^a-z]+block/)
    await request('shutdown', null)
    send({ method: 'exit' })
    const shutdownTimeout = setTimeout(() => child.kill(), 10_000)
    const [code] = await closed
    clearTimeout(shutdownTimeout)
    assert.equal(code, 0, stderr)
    assert.doesNotMatch(stderr, /Cannot find (?:module|package)|NATIVE_LOAD_FAILED/)
    return { initialize: true, completion: ':first-child', hover: 'display:block', shutdown: 0 }
  } finally {
    rejectPending(new Error('Verification disposed'))
    if (child.exitCode === null) child.kill()
    await closed.catch(() => {})
  }
}
