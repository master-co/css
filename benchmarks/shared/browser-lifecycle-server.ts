import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve } from 'node:path'

export async function startBrowserLifecycleServer(root: string) {
  const resolvedRoot = resolve(root)
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1')
      const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1))
      const file = resolve(resolvedRoot, relativePath)
      const relativeFile = relative(resolvedRoot, file)

      if (relativeFile.startsWith('..') || isAbsolute(relativeFile)) {
        response.writeHead(403)
        response.end('Forbidden')
        return
      }

      const body = await readFile(file)
      response.writeHead(200, {
        'content-type': getContentType(file),
        'cache-control': 'public, max-age=3600, immutable'
      })
      response.end(body)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.writeHead(404)
        response.end('Not found')
        return
      }

      response.writeHead(500)
      response.end((error as Error).message)
    }
  })

  await new Promise<void>((resolveListen, rejectListen) => {
    server.once('error', rejectListen)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', rejectListen)
      resolveListen()
    })
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    await closeServer(server)
    throw new Error('Unable to allocate local browser lifecycle benchmark server port.')
  }

  return {
    origin: `http://127.0.0.1:${address.port}/`,
    close: () => closeServer(server)
  }
}

function closeServer(server: Server) {
  return new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) rejectClose(error)
      else resolveClose()
    })
  })
}

function getContentType(file: string) {
  switch (extname(file)) {
    case '.html':
      return 'text/html; charset=utf-8'
    case '.css':
      return 'text/css; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    case '.png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}
