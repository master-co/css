import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const siteDir = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const outDir = path.join(siteDir, 'out')
const port = Number(process.env.MASTER_CSS_DOGFOOD_PORT || 4173)
const mimeTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.ico', 'image/x-icon'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.txt', 'text/plain; charset=utf-8'],
    ['.wasm', 'application/wasm'],
    ['.webp', 'image/webp'],
    ['.woff2', 'font/woff2']
])

const server = createServer(async (request, response) => {
    try {
        const pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname)
        const candidates = staticCandidates(pathname)
        let file
        for (const candidate of candidates) {
            if (await isFile(candidate)) {
                file = candidate
                break
            }
        }
        if (!file) {
            response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
            response.end('Not found')
            return
        }
        const metadata = await stat(file)
        response.writeHead(200, {
            'cache-control': 'no-store',
            'content-length': metadata.size,
            'content-type': mimeTypes.get(path.extname(file)) || 'application/octet-stream'
        })
        if (request.method === 'HEAD') response.end()
        else createReadStream(file).pipe(response)
    } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        response.end(error instanceof Error ? error.message : String(error))
    }
})

server.listen(port, '127.0.0.1', () => {
    console.log(`Master CSS site dogfood server listening on http://127.0.0.1:${port}`)
})

function staticCandidates(pathname) {
    const relative = pathname.replace(/^\/+/, '')
    const direct = safeOutputPath(relative || 'index.html')
    if (path.extname(relative)) return [direct]
    return [
        safeOutputPath(`${relative}.html`),
        safeOutputPath(path.join(relative, 'index.html')),
        direct
    ]
}

function safeOutputPath(relative) {
    const file = path.resolve(outDir, relative)
    const outputRelative = path.relative(outDir, file)
    if (outputRelative.startsWith('..') || path.isAbsolute(outputRelative)) {
        throw new Error('Requested path escapes site/out.')
    }
    return file
}

async function isFile(file) {
    try {
        return (await stat(file)).isFile()
    } catch {
        return false
    }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)))
}
