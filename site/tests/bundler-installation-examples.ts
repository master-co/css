import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { planMasterCSSSetup, applyMasterCSSSetupPlan } from '../../packages/create/dist/index.js'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const bundlerInstallationRoutes = ['/webpack', '/webpack/static-rendering', '/rspack', '/rspack/static-rendering', '/rsbuild', '/rsbuild/static-rendering'] as const
function dependency(name: string) {
  if (name === 'webpack') return join(repository, 'packages/webpack/node_modules/webpack')
  const store = join(repository, 'node_modules/.pnpm')
  const match = readdirSync(store).filter(value => value.startsWith(name.replace('/', '+') + '@')).sort().at(-1)
  assert.ok(match, `Existing workspace dependency required: ${name}`)
  return join(store, match, 'node_modules', name)
}
function unindent(source: string) {
  const lines = source.trimEnd().split('\n')
  const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
  return lines.map(line => line.slice(indent)).join('\n') + '\n'
}

/** Use published entrypoints and the exact complete files shown in each guide. */
export function bundlerInstallationFixture(route: typeof bundlerInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-bundler-install-'))
  const framework = route.split('/')[1] as 'webpack' | 'rspack' | 'rsbuild'
  const staticMode = route.endsWith('/static-rendering')
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    const packages = framework === 'webpack' ? ['webpack', 'webpack-cli', 'html-webpack-plugin'] : framework === 'rspack' ? ['@rspack/core', 'webpack'] : ['@rsbuild/core', 'webpack']
    write('package.json', JSON.stringify({ type: 'module', devDependencies: Object.fromEntries(packages.map(name => [name, '*'])) }))
    const plan = planMasterCSSSetup({ root, framework, mode: staticMode ? 'static' : undefined, install: false, yes: true })
    applyMasterCSSSetupPlan(plan, { install: false })
    const config = framework + '.config.' + (framework === 'rsbuild' ? 'ts' : 'mjs')
    assert.ok(readFileSync(join(root, config), 'utf8').includes('@master/css-webpack'))
    const source = installationSource(route)
    const fences = deliveryFences(source)
    for (const name of [config, 'src/index.css', 'src/index.js', 'index.html']) {
      const fence = fences.find(fence => fence.name === name)
      assert.ok(fence, `${route}: missing ${name}`)
      write(name, unindent(fence.text))
    }
    // Workspace symlinks must resolve published exports, not the monorepo's source aliases.
    if (framework === 'webpack') write(config, readFileSync(join(root, config), 'utf8').replace("entry: './src/index.js',", "entry: './src/index.js',\n  resolve: { tsconfig: false },"))
    const setup = fences.find(fence => fence.text.includes('npm create @master/css@rc'))!.text.trim()
    assert.equal(setup, `npm create @master/css@rc -- --framework ${framework}${staticMode ? ' --mode static' : ''} --yes`)
    for (const name of [...packages, '@master/css', '@master/css-webpack', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(name.startsWith('@master/') ? join(repository, 'node_modules', name) : dependency(name), destination, 'dir')
    }
    const cliPackage = framework === 'webpack' ? 'webpack-cli' : '@rsbuild/core'
    const pkg = JSON.parse(readFileSync(join(dependency(cliPackage), 'package.json'), 'utf8'))
    const executable = typeof pkg.bin === 'string' ? pkg.bin : Object.values(pkg.bin)[0] as string
    const command = fences.find(fence => fence.text.trim() === (framework === 'webpack' ? 'npx webpack --mode production' : `npx ${framework} build`))!.text.trim()
    // Rspack core is already installed; its optional CLI is not a repository dependency.
    // Compile the authored config with the equivalent production-mode public API.
    if (framework === 'rspack') write('.fixture-build.mjs', `import { rspack } from '@rspack/core';
import config from './rspack.config.mjs';
const compiler = rspack({ ...config, mode: 'production' });
try { await new Promise((resolve, reject) => compiler.run((error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve())); }
finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())); }
`)
    const args = framework === 'rspack' ? [join(root, '.fixture-build.mjs')] : [join(dependency(cliPackage), executable), ...command.split(' ').slice(2)]
    const built = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 60000 })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    const assets = readdirSync(join(root, 'dist'), { recursive: true }).filter((file): file is string => typeof file === 'string')
    const css = assets.filter(file => file.endsWith('.css')).map(file => readFileSync(join(root, 'dist', file), 'utf8')).join('\n')
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    assert.match(html, /Hello World/)
    assert.match(html, /<link[^>]+\.css/)
    if (staticMode) {
      assert.match(css, /font-style:\s?italic/)
      assert.ok(!assets.some(file => /\.wasm$|master-css-runtime|master-css-manifest/.test(file)), 'Static builds must not ship runtime assets')
    } else {
      assert.match(html, /<script[^>]+master-css-runtime/)
      assert.ok(assets.some(file => file.endsWith('.wasm')), 'Runtime Wasm is emitted')
    }
    return { root: join(root, 'dist'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyBundlerInstallationExamples() {
  for (const route of bundlerInstallationRoutes) bundlerInstallationFixture(route).dispose()
}
