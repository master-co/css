import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'

assert(process.cwd().includes('master-css-bh-isolated-'))
const auditRoot = fileURLToPath(new URL('../', import.meta.url))
const resultPath = join(auditRoot, `evidence/0059-vscode-${process.env.BH_VSCODE_CONTROL ? 'control' : 'host'}.json`)
const build = spawnSync('pnpm', ['exec', 'tsdown'], { stdio: 'inherit', env: process.env, timeout: 120000 })
assert.equal(build.status, 0, 'fresh isolated extension/server build')
const { createStagedExtension } = await import(pathToFileURL(resolve('scripts/package-target-core.js')).href)
const stagingRoot = await mkdtemp(join(tmpdir(), 'bh59-'))
try {
  const { stagingDir } = await createStagedExtension('darwin-arm64', { stagingRoot })
  const workspace = join(stagingRoot, 'workspace')
  await mkdir(join(workspace, '.vscode'), { recursive: true })
  const manifest = JSON.parse(await readFile(join(stagingDir, 'package.json'), 'utf8'))
  await writeFile(join(workspace, '.vscode/settings.json'), JSON.stringify({
    'masterCSS.embeddedSyntaxHighlighting': 'active', 'masterCSS.formatDirectives': false,
    'css.format.enable': false, 'editor.defaultFormatter': `${manifest.publisher}.${manifest.name}`
  }))
  await writeFile(join(workspace, 'index.html'), '<div class="fg:red block:hover"></div>\n<span class="inline-flex"></span>')
  await writeFile(join(workspace, 'style.css'), '.btn { @compose bg:transparent !; }')
  const env = { ...process.env }
  delete env.ELECTRON_RUN_AS_NODE
  const child = spawn('/Applications/Visual Studio Code.app/Contents/MacOS/Code', [
    '--new-window', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust',
    '--user-data-dir', join(stagingRoot, 'profile'), '--extensions-dir', join(stagingRoot, 'extensions'),
    `--extensionDevelopmentPath=${stagingDir}`,
    `--extensionTestsPath=${join(auditRoot, 'repros/vscode-settings-host.cjs')}`, workspace
  ], { stdio: 'inherit', env: { ...env, MASTER_CSS_AUDIT_EXTENSION: stagingDir,
    MASTER_CSS_AUDIT_RESULT: resultPath } })
  const timeout = setTimeout(() => child.kill('SIGTERM'), 180000)
  const status = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve) }).finally(() => clearTimeout(timeout))
  console.log('VS Code settings host exit:', status)
  assert.equal(status, 0)
  const result = JSON.parse(await readFile(resultPath, 'utf8'))
  assert(result.records.some(record => record.complete === true), 'host wrote complete evidence')
} finally { await rm(stagingRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) }
