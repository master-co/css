import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, extname, join, normalize, relative } from 'node:path'

const astroCLI = join(dirname(createRequire(import.meta.url).resolve('astro/package.json')), 'bin/astro.mjs')
const contentTypes: Record<string, string> = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm'
}

export function buildAstroFixture(fixtureDir: string) {
  execFileSync(process.execPath, [astroCLI, 'build'], {
    cwd: fixtureDir,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
    timeout: 120_000
  })
}

/** Serve a static build output over HTTP; resolves to its origin and a closer. */
export async function serveStaticOutput(outDir: string) {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname
    const file = normalize(join(outDir, pathname === '/' ? 'index.html' : pathname))
    if (relative(outDir, file).startsWith('..')) return void response.writeHead(403).end()
    try {
      const body = await readFile(file)
      response.writeHead(200, { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' }).end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return {
    origin: `http://127.0.0.1:${typeof address === 'object' && address?.port}`,
    close: () => new Promise<void>(resolve => server.close(() => resolve()))
  }
}
