import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

const require = createRequire(import.meta.url)
const sassDirectory = dirname(createRequire(require.resolve('vite')).resolve('sass'))

for (const extension of ['css', 'scss']) test(`BH-0004 development ${extension} Modules preserve exports before native pruning`, async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-dev-module-')))
  let server: Awaited<ReturnType<typeof createServer>> | undefined
  try {
    mkdirSync(join(root, 'node_modules'))
    symlinkSync(sassDirectory, join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, `style.module.${extension}`), '@master entry;.example{composes:shared from "./shared.module.css";background:blue}')
    writeFileSync(join(root, 'shared.module.css'), '.shared{color:red}')
    server = await createServer({ root, configFile: false, logLevel: 'silent', css: { modules: { generateScopedName: 'scope_[local]' } }, plugins: masterCSS({ mode: 'static', runtime: false }), server: { host: '127.0.0.1', port: 0 } })
    await server.listen()
    const result = await server.transformRequest(`/style.module.${extension}`)
    expect(result?.code).toContain('scope_example scope_shared')
    expect(result?.code).toMatch(/export\s*\{[^}]*example/)
    const stylesheet = await server.transformRequest(`/style.module.${extension}.master-css-sass.css`)
    expect(stylesheet?.code).toContain('.scope_example')
    expect(stylesheet?.code).toContain('.scope_shared')
  } finally { await server?.close(); rmSync(root, { recursive: true, force: true }) }
})
