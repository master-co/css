import { spawn } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const packageDir = resolve(here, '..')
const distDir = resolve(packageDir, 'dist')
const serverPath = resolve(distDir, 'server.min.mjs')
const workspaceDir = resolve(here, 'fixtures', 'bundled-config')

function encode(message) {
    const body = Buffer.from(JSON.stringify(message))
    return Buffer.concat([
        Buffer.from(`Content-Length: ${body.length}\r\n\r\n`),
        body
    ])
}

function createLanguageServer() {
    const child = spawn(process.execPath, [serverPath, '--stdio'], {
        cwd: packageDir,
        stdio: ['pipe', 'pipe', 'pipe']
    })
    let nextId = 1
    let stdout = Buffer.alloc(0)
    const stderr = []
    const notifications = []
    const pending = new Map()
    const waiters = new Set()

    function rejectAll(error) {
        for (const waiter of waiters) {
            clearTimeout(waiter.timer)
            waiter.reject(error)
        }
        waiters.clear()
        for (const request of pending.values()) {
            clearTimeout(request.timer)
            request.reject(error)
        }
        pending.clear()
    }

    function handleMessage(message) {
        if (Object.hasOwn(message, 'id') && pending.has(message.id)) {
            const request = pending.get(message.id)
            pending.delete(message.id)
            clearTimeout(request.timer)
            if (message.error) {
                request.reject(new Error(message.error.message))
            } else {
                request.resolve(message.result)
            }
            return
        }

        notifications.push(message)
        for (const waiter of waiters) {
            if (!waiter.predicate(message)) continue
            clearTimeout(waiter.timer)
            waiters.delete(waiter)
            waiter.resolve(message)
        }
    }

    child.stdout.on('data', (chunk) => {
        stdout = Buffer.concat([stdout, chunk])
        while (true) {
            const headerEnd = stdout.indexOf('\r\n\r\n')
            if (headerEnd === -1) return
            const header = stdout.subarray(0, headerEnd).toString()
            const lengthMatch = header.match(/Content-Length: (\d+)/i)
            expect(lengthMatch, `Invalid LSP header: ${header}`).toBeTruthy()
            const bodyStart = headerEnd + 4
            const bodyEnd = bodyStart + Number(lengthMatch[1])
            if (stdout.length < bodyEnd) return
            const body = stdout.subarray(bodyStart, bodyEnd).toString()
            stdout = stdout.subarray(bodyEnd)
            handleMessage(JSON.parse(body))
        }
    })

    child.stderr.on('data', (chunk) => {
        stderr.push(chunk.toString())
    })

    child.on('error', rejectAll)
    child.on('close', (code) => {
        rejectAll(new Error(`Language server exited with code ${code}\n${stderr.join('')}`))
    })

    function write(message) {
        child.stdin.write(encode(message))
    }

    return {
        request(method, params) {
            const id = nextId++
            write({
                jsonrpc: '2.0',
                id,
                method,
                params
            })
            return new Promise((resolvePromise, rejectPromise) => {
                const timer = setTimeout(() => {
                    pending.delete(id)
                    rejectPromise(new Error(`Timed out waiting for ${method}\n${stderr.join('')}`))
                }, 5000)
                pending.set(id, {
                    resolve: resolvePromise,
                    reject: rejectPromise,
                    timer
                })
            })
        },
        notify(method, params) {
            write({
                jsonrpc: '2.0',
                method,
                params
            })
        },
        waitForNotification(predicate) {
            const existing = notifications.find(predicate)
            if (existing) return Promise.resolve(existing)
            return new Promise((resolvePromise, rejectPromise) => {
                const waiter = {
                    predicate,
                    resolve: resolvePromise,
                    reject: rejectPromise,
                    timer: setTimeout(() => {
                        waiters.delete(waiter)
                        rejectPromise(new Error(`Timed out waiting for notification\n${stderr.join('')}`))
                    }, 5000)
                }
                waiters.add(waiter)
            })
        },
        stderr() {
            return stderr.join('')
        },
        notifications() {
            return notifications
        },
        async dispose() {
            child.stdin.end()
            child.kill()
        }
    }
}

test('build emits the SWC wasm asset beside the server bundle', () => {
    expect(statSync(serverPath).isFile()).toBe(true)
    expect(statSync(resolve(distDir, 'wasm_bg.wasm')).size).toBeGreaterThan(0)
})

test('bundled language server loads a TypeScript workspace config', async () => {
    const server = createLanguageServer()
    const workspaceUri = pathToFileURL(workspaceDir).toString()
    const documentUri = pathToFileURL(resolve(workspaceDir, 'index.html')).toString()

    try {
        await server.request('initialize', {
            processId: null,
            rootUri: workspaceUri,
            capabilities: {
                textDocument: {
                    hover: {
                        contentFormat: ['markdown', 'plaintext']
                    }
                },
                workspace: {
                    workspaceFolders: true
                }
            },
            workspaceFolders: [
                {
                    uri: workspaceUri,
                    name: 'bundled-config'
                }
            ]
        })
        server.notify('initialized', {})
        server.notify('textDocument/didOpen', {
            textDocument: {
                uri: documentUri,
                languageId: 'html',
                version: 1,
                text: readFileSync(resolve(workspaceDir, 'index.html'), 'utf8')
            }
        })

        await server.waitForNotification((message) =>
            message.method === 'window/logMessage'
            && message.params?.message?.includes('Initialized workspace (with config file)')
        )

        expect(server.stderr().includes('Cannot find module')).toBe(false)
        expect(JSON.stringify(server.notifications()).includes('Failed to load config')).toBe(false)
    } finally {
        await server.dispose()
    }
})
