import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const store = join(repository, 'node_modules/.pnpm')
const dependency = (name: string) => {
  if (name.startsWith('@master/')) return join(repository, 'node_modules', name)
  const version = name === 'typescript' ? '6.' : name.startsWith('@angular/') ? '22.' : ''
  const entry = readdirSync(store).find(entry => entry.startsWith(name.replace('/', '+') + '@' + version))
  assert.ok(entry, `Missing installed fixture dependency: ${name}`)
  return join(store, entry, 'node_modules', name)
}

/** Uses the installed Angular 22 CLI/compiler and real Master CSS CLI output.
 * CDN bytes are served from the repository's built runtime in browser tests;
 * external CDN availability and Angular SSR are not covered by this fixture.
 */
export function angularInstallationFixture(mode: 'runtime' | 'static') {
  const root = mkdtempSync(join(tmpdir(), 'master-angular-doc-'))
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const cli = join(dependency('@angular/cli'), 'bin/ng.js')
  const run = (args: string[]) => {
    const result = spawnSync(process.execPath, args, {
      cwd: root, encoding: 'utf8', timeout: 120000,
      env: { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false' },
    })
    assert.equal(result.status, 0, `${mode}: ${result.stderr}\n${result.stdout}`)
  }
  const write = (name: string, text: string) => {
    mkdirSync(dirname(join(root, name)), { recursive: true })
    writeFileSync(join(root, name), text)
  }
  try {
    run([cli, 'new', 'my-app', '--directory', '.', '--skip-install', '--skip-git', '--defaults', '--ssr=false', '--style=css'])
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    const names = new Set([...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies), '@master/css'])
    for (const name of names) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(dependency(name), destination, 'dir')
    }
    const source = installationSource(`/angular/${mode}-rendering`)
    const fences = deliveryFences(source)
    const fence = (name: string) => {
      const found = fences.find(fence => fence.name === name)
      assert.ok(found, name)
      const lines = found.text.trimEnd().split('\n')
      const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
      return lines.map(line => line.slice(indent)).join('\n') + '\n'
    }
    for (const name of ['src/index.html', 'src/app/app.html']) write(name, fence(name))
    // The generated RouterOutlet is unused after replacing the starter template.
    // Preserve app providers/bootstrap; trim only that unused component import.
    const app = readFileSync(join(root, 'src/app/app.ts'), 'utf8')
    write('src/app/app.ts', app.replace("import { RouterOutlet } from '@angular/router';\n", '').replace('imports: [RouterOutlet]', 'imports: []'))
    if (mode === 'runtime') {
      const quick = deliveryFences(installationSource('/angular'))
      for (const name of ['src/index.html', 'src/app/app.html']) {
        assert.equal(quick.find(fence => fence.name === name)!.text.trim(), fences.find(fence => fence.name === name)!.text.trim())
      }
      assert.doesNotMatch(fence('src/index.html'), /<html[^>]*\bhidden\b/)
    } else {
      write('master.css', fence('master.css'))
      const config = JSON.parse(readFileSync(join(root, 'angular.json'), 'utf8'))
      assert.ok(config.projects['my-app'].architect.build.options.assets.some((entry: unknown) => JSON.stringify(entry) === JSON.stringify(JSON.parse(fence('Asset entry')))))
      run([join(repository, 'packages/cli/dist/bin/index.js'), 'generate', '--output', 'public/master-css/master.css'])
      const generated = readdirSync(join(root, 'public/master-css')).filter(name => name.endsWith('.css')).map(name => readFileSync(join(root, 'public/master-css', name), 'utf8')).join('\n')
      assert.match(generated, /font-style:italic/)
      assert.match(generated, /margin:var\(--spacing-md\)/)
      assert.doesNotMatch(generated, /@theme|@utilities/)
    }
    run([cli, 'build'])
    return { root: join(root, 'dist/my-app/browser'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyAngularInstallationExamples() {
  for (const mode of ['runtime', 'static'] as const) angularInstallationFixture(mode).dispose()
}
