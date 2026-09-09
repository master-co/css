import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, realpathSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
if (process.argv[2] === '--child') {
  const { resolveConfig, preprocessCSS } = await import(require.resolve('vite'))
  const root = process.argv[3]
  const config = await resolveConfig({ root, configFile: false, logLevel: 'silent' }, 'build')
  try {
    await preprocessCSS('.example { composes: shared from "./shared.module.css"; }', join(root, 'style.module.css'), config)
    console.log(JSON.stringify({ phase: 'unexpected-success' }))
    process.exitCode = 2
  } catch (error) {
    console.log(JSON.stringify({ phase: 'caught-rejection', message: String(error) }))
  }
} else {
  for (const nested of [false, true]) {
    const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-missing-module-host-')))
    try {
      if (nested) writeFileSync(join(root, 'shared.module.css'), '.shared { composes: leaf from "./leaf.module.css"; }')
      const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), '--child', root], { encoding: 'utf8', timeout: 30000 })
      console.log(JSON.stringify({ nested, exitCode: child.status, signal: child.signal, error: child.error?.message, stdout: child.stdout, stderr: child.stderr }))
      // Report the host behavior, including process termination, without masking
      // it as a successful product recovery or installing process-wide handlers.
    } finally { rmSync(root, { recursive: true, force: true }) }
  }
}
