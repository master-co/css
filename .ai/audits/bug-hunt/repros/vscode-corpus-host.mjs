import assert from 'node:assert/strict'
import { cp, mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir, homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'

assert(process.cwd().includes('master-css-bh-isolated-'))
const auditRoot = fileURLToPath(new URL('../', import.meta.url))
const repo = resolve(auditRoot, '../../..')
const resultPath = join(auditRoot, 'evidence/0083-vscode-corpus.json')
const build = spawnSync('pnpm', ['exec', 'tsdown'], { stdio: 'inherit', env: process.env, timeout: 120000 })
assert.equal(build.status, 0, 'fresh isolated extension/server build')
const { createStagedExtension } = await import(pathToFileURL(resolve('scripts/package-target-core.js')).href)
const stagingRoot = await mkdtemp(join(tmpdir(), 'bh83-'))
try {
  const { stagingDir } = await createStagedExtension('darwin-arm64', { stagingRoot })
  const workspace = join(stagingRoot, 'workspace')
  await cp(join(repo, 'packages/language-service/playground'), workspace, { recursive: true })
  const manifest = JSON.parse(await readFile(join(stagingDir, 'package.json'), 'utf8'))
  const settingsPath = join(workspace, '.vscode/settings.json')
  const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
  await writeFile(settingsPath, JSON.stringify({ ...settings,
    'extensions.autoUpdate': false, 'extensions.autoCheckUpdates': false,
    'update.mode': 'none', 'telemetry.telemetryLevel': 'off',
    'masterCSS.embeddedSyntaxHighlighting': 'always',
    'css.format.enable': false, 'editor.defaultFormatter': `${manifest.publisher}.${manifest.name}`
  }))
  const extensions = ['vue.volar-3.3.11', 'svelte.svelte-vscode-110.3.1', 'astro-build.astro-vscode-2.16.20-darwin-arm64']
  await mkdir(join(stagingRoot, 'extensions'), { recursive: true })
  for (const name of extensions) await cp(join(homedir(), '.vscode/extensions', name), join(stagingRoot, 'extensions', name), { recursive: true })
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const child = spawn('/Applications/Visual Studio Code.app/Contents/MacOS/Code', [
    '--new-window', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust',
    '--user-data-dir', join(stagingRoot, 'profile'), '--extensions-dir', join(stagingRoot, 'extensions'),
    `--extensionDevelopmentPath=${stagingDir}`,
    `--extensionTestsPath=${join(auditRoot, 'repros/vscode-corpus-host.cjs')}`, workspace
  ], { stdio: 'inherit', env: { ...env, MASTER_CSS_AUDIT_EXTENSION: stagingDir, MASTER_CSS_AUDIT_RESULT: resultPath } })
  console.log(JSON.stringify({ stagingRoot, pid: child.pid, extensions }))
  const timeout = setTimeout(() => child.kill('SIGTERM'), 300000)
  const status = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) }).finally(() => clearTimeout(timeout))
  console.log('VS Code corpus host exit:', status)
  assert.equal(status, 0)
  const result = JSON.parse(await readFile(resultPath, 'utf8'))
  assert(result.records.some(record => record.complete === true), 'host wrote complete evidence')
} finally { await rm(stagingRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) }
