import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { createServer as createViteServer } from 'vite'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const fixtureDir = join(packageDir, 'tests/fixtures/theme-reference')

// SvelteKit 3 renders through a Vite module runner. Classes found while a route
// first renders must not reload that runner under the request rendering them.
it('renders first visits while their classes are discovered', async () => {
  const directory = mkdtempSync(join(packageDir, 'tests/fixtures/dev-first-visit-'))
  cpSync(fixtureDir, directory, { recursive: true, filter: source => !source.includes('/.svelte-kit') && !source.includes('/node_modules') })
  writeFileSync(join(directory, 'src/routes/+page.svelte'), "<script>import './globals.css'</script><main class=\"probe display:grid\">First visit</main>")
  writeFileSync(join(directory, 'src/routes/unloaded/+page.svelte'), "<script>import '../globals.css'</script><main class=\"display:flex\">Other route</main>")
  let server: Awaited<ReturnType<typeof createViteServer>> | undefined
  const previousDirectory = process.cwd()
  try {
    process.chdir(directory)
    server = await createViteServer({ configFile: join(directory, 'vite.config.ts'), logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    // Without a browser, each route reaches the server program before the client.
    for (const path of ['', 'unloaded']) {
      const response = await fetch(new URL(path, server.resolvedUrls!.local[0]))
      expect(response.status, await response.text()).toBe(200)
    }
  } finally {
    process.chdir(previousDirectory)
    await server?.close()
    rmSync(directory, { recursive: true, force: true })
  }
}, 60_000)
