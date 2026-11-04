import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

/** Install the real VSIX, then exercise it in an isolated official VS Code host. */
export async function verifyExtensionHost({ vsix, manifest, temporary, env, testElectronModule, executable, vscodeVersion }) {
  const { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath, runTests } = await import(pathToFileURL(testElectronModule).href)
  const vscodeExecutablePath = executable ?? await downloadAndUnzipVSCode({ version: vscodeVersion, cachePath: join(temporary, 'vscode') })
  const extensionsDir = join(temporary, 'extensions'), userData = join(temporary, 'user-data')
  const driver = join(temporary, 'driver'), workspace = join(temporary, 'workspace')
  await Promise.all([mkdir(driver), mkdir(workspace), mkdir(join(userData, 'User'), { recursive: true })])
  await writeFile(join(userData, 'User/settings.json'), JSON.stringify({
    'telemetry.telemetryLevel': 'off', 'update.mode': 'none', 'extensions.autoUpdate': false,
    'extensions.autoCheckUpdates': false, 'security.workspace.trust.enabled': false,
    'workbench.startupEditor': 'none', 'chat.disableAIFeatures': true
  }))
  await writeFile(join(driver, 'package.json'), JSON.stringify({ name: 'vsix-verification-driver',
    version: '0.0.0', publisher: 'verification', engines: { vscode: '^1.120.0' }, main: 'index.cjs' }))
  await writeFile(join(driver, 'index.cjs'), 'exports.activate = () => {}\n')
  await cp(new URL('../tests/vsix-extension-host.cjs', import.meta.url), join(driver, 'test.cjs'))
  const id = `${manifest.publisher}.${manifest.name}`
  await writeFile(join(driver, 'expected.json'), JSON.stringify({ id, version: manifest.version, extensionsDir }))
  const profileArgs = ['--extensions-dir', extensionsDir, '--user-data-dir', userData, '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes']
  const [cli, ...cliArgs] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath, { reuseMachineInstall: true })
  const run = promisify(execFile)
  const options = { env, maxBuffer: 16 * 1024 * 1024, timeout: 120_000, shell: process.platform === 'win32' }
  await run(cli, [...cliArgs, ...profileArgs, '--install-extension', vsix, '--force'], options)
  const installed = await run(cli, [...cliArgs, ...profileArgs, '--list-extensions', '--show-versions'], options)
  assert.ok(installed.stdout.split(/\r?\n/).includes(`${id}@${manifest.version}`), installed.stdout)
  await runTests({ vscodeExecutablePath, extensionDevelopmentPath: driver, extensionTestsPath: join(driver, 'test.cjs'),
    extensionTestsEnv: env, launchArgs: [...profileArgs, '--disable-gpu', '--no-sandbox', workspace] })
  return JSON.parse(await readFile(join(driver, 'host-proof.json'), 'utf8'))
}
