// Playwright #42768: isolate Gecko's application data as well as its profile.
// https://github.com/microsoft/playwright/issues/42768
// Leaves the installed browser, personal Firefox data and macOS permissions intact.
import { firefox } from '@playwright/test'
import { mkdtemp, readFile, readdir, writeFile, symlink, chmod, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

if (process.platform !== 'darwin') throw new Error('This launcher is only for the macOS Gecko app-data issue; use the ordinary e2e command on other platforms.')
const root = fileURLToPath(new URL('../', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'master-css-firefox-'))
const binary = firefox.executablePath()
const resources = join(dirname(dirname(binary)), 'Resources')
const quote = value => `'${value.replaceAll('\'', '\'\\\'\'')}'`
try {
  const original = await readFile(join(resources, 'application.ini'), 'utf8')
  if (!original.includes('Name=Firefox') || !original.includes('Vendor=Mozilla')) throw new Error('Unexpected Firefox application descriptor; inspect the installed browser before adapting the launcher.')
  await writeFile(join(temporary, 'application.ini'), original
    .replace(/^Name=Firefox$/m, 'Name=MasterCSSPlaywright')
    .replace(/^Vendor=Mozilla$/m, 'Vendor=MasterCSSTests')
    .replace(/^EnableProfileMigrator=1$/m, 'EnableProfileMigrator=0'))
  for (const name of await readdir(join(resources, 'browser'))) {
    if (name !== 'application.ini') await symlink(join(resources, 'browser', name), join(temporary, name))
  }
  const executable = join(temporary, 'firefox')
  await writeFile(executable, `#!/bin/sh\nexec ${quote(binary)} -app ${quote(join(temporary, 'application.ini'))} "$@"\n`)
  await chmod(executable, 0o755)
  const config = join(temporary, 'playwright.config.mjs')
  await writeFile(config, `import original from ${JSON.stringify(join(root, 'playwright.config.ts'))};\nexport default {...original, testDir:${JSON.stringify(root)}, projects:original.projects.filter(p=>p.name==='firefox').map(p=>({...p,use:{...p.use,launchOptions:{...p.use?.launchOptions,executablePath:${JSON.stringify(executable)}}}}))};\n`)
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'playwright', 'test', '--config', config, ...process.argv.slice(2)], { cwd: root, stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', code => resolve(code ?? 1))
  })
} finally {
  await rm(temporary, { recursive: true, force: true })
}
