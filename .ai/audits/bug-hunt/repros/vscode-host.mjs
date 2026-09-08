import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createStagedExtension } from '../../../../packages/vscode/scripts/package-target-core.js'

const stagingRoot = await mkdtemp(join(tmpdir(), 'master-css-audit-vscode-'))
try {
  const { stagingDir } = await createStagedExtension('darwin-arm64', { stagingRoot })
  const workspace = join(stagingRoot, 'workspace')
  await mkdir(workspace)
  await writeFile(join(workspace, 'index.html'), '<div class="fg:red"></div>')
  const testEnvironment = { ...process.env }
  delete testEnvironment.ELECTRON_RUN_AS_NODE
  const child = spawn('/Applications/Visual Studio Code.app/Contents/MacOS/Code', [
    '--new-window', '--skip-welcome', '--skip-release-notes', '--disable-workspace-trust',
    '--user-data-dir', join(stagingRoot, 'profile'), '--extensions-dir', join(stagingRoot, 'extensions'),
    `--extensionDevelopmentPath=${stagingDir}`,
    `--extensionTestsPath=${resolve('.ai/audits/bug-hunt/repros/vscode-host.cjs')}`, workspace
  ], {
    stdio: 'inherit', env: {
      ...testEnvironment,
      MASTER_CSS_AUDIT_EXTENSION: stagingDir,
      MASTER_CSS_AUDIT_RESULT: resolve('.ai/audits/bug-hunt/evidence/0016-vscode-host.json')
    }
  })
  const status = await new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })
  console.log('VS Code extension test exit:', status)
  process.exitCode = status ?? 1
} finally {
  await rm(stagingRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
}
