import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { createServer } from 'vite'
import { expect, test } from 'vitest'
import masterCSS from '../../src/core'

for (const relation of ['import', 'composes']) {
  for (const childModule of [false, true]) {
    test(`local Modules ${relation} exports match pure Vite with childModule=${childModule}`, async () => {
      const parent = join(process.cwd(), 'tmp'); mkdirSync(parent, { recursive: true })
      const root = mkdtempSync(join(parent, 'imported-module-exports-'))
      const child = childModule ? 'child.module.css' : 'child.css'
      const source = relation === 'import'
        ? `@import "./${child}" layer(guard);.local{display:inline-flex}`
        : `.local{composes: child from "./${child}";display:inline-flex}`
      const results: Record<string, unknown>[] = []
      try {
        writeFileSync(join(root, 'style.module.css'), source)
        writeFileSync(join(root, child), '.child{padding:2rem}')
        writeFileSync(join(root, 'entry.js'), 'export {default as names} from "./style.module.css";export {default as css} from "./style.module.css?inline";')
        for (const managed of [false, true]) {
          const server = await createServer({ root, cacheDir: join(root, '.vite'), configFile: false, logLevel: 'silent', plugins: managed ? masterCSS({ mode: 'static', runtime: false }) : [], css: { modules: { generateScopedName: (name, file) => basename(file.split('?')[0]).replaceAll('.', '_') + '_' + name } }, server: { host: '127.0.0.1', port: 0 } })
          try {
            await server.listen()
            const result = await server.ssrLoadModule('/entry.js')
            results.push({ names: result.names, css: result.css })
          } finally { await server.environments.client.waitForRequestsIdle(); await server.close() }
        }
        console.log(JSON.stringify({ relation, childModule, results }))
        expect(results[1].names).toEqual(results[0].names)
      } finally { rmSync(root, { recursive: true, force: true }) }
    })
  }
}
