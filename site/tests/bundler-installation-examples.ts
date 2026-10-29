import { workspaceDependency } from './workspace-dependency'
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
export const bundlerInstallationRoutes = ['/webpack', '/webpack/runtime', '/rspack', '/rspack/runtime', '/rsbuild', '/rsbuild/runtime'] as const
const dependency = (name: string) => workspaceDependency(name, new URL('../../packages/webpack/package.json', import.meta.url))
function unindent(source: string) {
  const lines = source.trimEnd().split('\n')
  const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
  return lines.map(line => line.slice(indent)).join('\n') + '\n'
}

/** Use published entrypoints and the exact complete files shown in each guide. */
export function bundlerInstallationFixture(route: typeof bundlerInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-bundler-install-'))
  const framework = route.split('/')[1] as 'webpack' | 'rspack' | 'rsbuild'
  const staticMode = !route.endsWith('/runtime')
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    const packages = framework === 'webpack' ? ['webpack', 'webpack-cli', 'html-webpack-plugin'] : framework === 'rspack' ? ['@rspack/core', 'webpack'] : ['@rsbuild/core', 'webpack']
    write('package.json', JSON.stringify({ type: 'module', devDependencies: Object.fromEntries(packages.map(name => [name, '*'])) }))
    const plan = planMasterCSSSetup({ root, framework, mode: staticMode ? undefined : 'runtime', install: false, yes: true })
    applyMasterCSSSetupPlan(plan, { install: false })
    const config = framework + '.config.' + (framework === 'rsbuild' ? 'ts' : 'mjs')
    assert.ok(readFileSync(join(root, config), 'utf8').includes('@master/css-webpack'))
    const source = installationSource(route)
    const fences = deliveryFences(source)
    for (const name of [config, 'src/index.css']) {
      const fence = fences.find(fence => fence.name === name)
      assert.ok(fence, `${route}: missing ${name}`)
      write(name, unindent(fence.text))
    }
    // The guides show the integration and markup, not a complete host scaffold.
    const markup = fences.map(fence => fence.text.match(/<h1\b[\s\S]*?<\/h1>/)?.[0]).find(Boolean)
    assert.ok(markup, `${route}: missing authored heading`)
    write('index.html', `<!doctype html><html><head></head><body>${markup.replaceAll('className=', 'class=')}</body></html>`)
    const classes = markup.match(/class(?:Name)?="([^"]+)"/)?.[1]
    assert.ok(classes, `${route}: missing authored classes`)
    write('src/index.js', `import "./index.css";document.querySelector('h1').className = ${JSON.stringify(classes)};`)
    const setup = fences.find(fence => fence.text.includes('npm create @master/css@rc'))!.text.trim()
    assert.equal(setup, `npm create @master/css@rc -- --framework ${framework}${staticMode ? '' : ' --mode runtime'} --yes`)
    for (const name of [...packages, '@master/css', '@master/css-webpack', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(name.startsWith('@master/') ? join(repository, 'node_modules', name) : dependency(name), destination, 'dir')
    }
    if (framework === 'rsbuild') write('.fixture-build.mjs', `import { createRsbuild } from '@rsbuild/core';
import config from './rsbuild.config.ts';
const app = await createRsbuild({ rsbuildConfig: { ...config, source: { entry: { index: './src/index.js' } }, html: { template: './index.html' } } });
await app.build();
`)
    else write('.fixture-build.mjs', `import host from '${framework === 'webpack' ? 'webpack' : '@rspack/core'}';
${framework === 'webpack' ? "import HtmlPlugin from 'html-webpack-plugin';" : 'const HtmlPlugin = host.HtmlRspackPlugin;'}
import config from './${config}';
const compiler = host({ ...config, mode: 'production', entry: './src/index.js', ${framework === 'webpack' ? 'resolve: { tsconfig: false }, experiments: { css: true },' : ''} plugins: [new HtmlPlugin({ template: './index.html' }), ...config.plugins] });
try { await new Promise((resolve, reject) => compiler.run((error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve())); }
finally { await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve())); }
`)
    const args = [join(root, '.fixture-build.mjs')]
    const built = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 60000 })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    const assets = readdirSync(join(root, 'dist'), { recursive: true }).filter((file): file is string => typeof file === 'string')
    const css = assets.filter(file => file.endsWith('.css')).map(file => readFileSync(join(root, 'dist', file), 'utf8')).join('\n')
    const html = readFileSync(join(root, 'dist/index.html'), 'utf8')
    assert.match(html, /Hello World/)
    assert.match(html, /<link[^>]+\.css/)
    if (staticMode) {
      assert.match(css, /font-style:\s?italic/)
      assert.ok(!assets.some(file => /\.wasm$|master-css-runtime|master-css-manifest|master-css-program/.test(file)), 'Static builds must not ship runtime assets')
    } else {
      assert.match(html, /<script[^>]+master-css-runtime/)
      assert.ok(assets.some(file => /master-css-program.*\.bin$/.test(file)), 'Runtime program is emitted')
      assert.ok(!assets.some(file => file.endsWith('.wasm')), 'Browser runtime uses the JavaScript engine')
    }
    return { root: join(root, 'dist'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyBundlerInstallationExamples() {
  for (const route of bundlerInstallationRoutes) bundlerInstallationFixture(route).dispose()
}
