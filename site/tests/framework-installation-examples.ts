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
export const frameworkInstallationRoutes = ['/react', '/react/runtime', '/vuejs', '/vuejs/runtime', '/lit'] as const

const dependency = workspaceDependency

/** Build the actual authored component through the public installer and Vite plugin. */
export function frameworkInstallationFixture(route: typeof frameworkInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-framework-install-'))
  const framework = route.startsWith('/react') ? 'react' : route.startsWith('/vuejs') ? 'vue' : 'lit'
  const staticMode = !route.endsWith('/runtime')
  const write = (name: string, text: string) => {
    const file = join(root, name)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }
  const dispose = () => rmSync(root, { recursive: true, force: true })
  try {
    const plugin = framework === 'react' ? '@vitejs/plugin-react' : '@vitejs/plugin-vue'
    const packages = framework === 'react' ? ['react', 'react-dom', plugin] : framework === 'vue' ? ['vue', plugin] : ['lit']
    write('package.json', JSON.stringify({ type: 'module', dependencies: Object.fromEntries(packages.map(name => [name, '*'])), devDependencies: { vite: '*' } }))
    write('vite.config.ts', framework === 'lit' ? "import { defineConfig } from 'vite'\nexport default defineConfig({})\n" : `import { defineConfig } from 'vite'\nimport framework from '${plugin}'\nexport default defineConfig({ plugins: [framework()] })\n`)
    write('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', jsx: 'react-jsx', experimentalDecorators: true, useDefineForClassFields: false } }))
    const cssEntry = framework === 'react' ? 'src/index.css' : framework === 'vue' ? 'src/assets/main.css' : 'src/index.css'
    write(cssEntry, 'body { margin: 0; }\n')
    const component = framework === 'react' ? 'src/App.tsx' : framework === 'vue' ? 'src/App.vue' : 'src/my-element.ts'
    const source = installationSource(route)
    const authored = deliveryFences(source).find(fence => fence.name === component)!.text
    // Keep normal template input for the installer; then use the complete authored component.
    write(component, framework === 'lit' ? "import { LitElement, html } from 'lit'\nimport { customElement } from 'lit/decorators.js'\n@customElement('my-element')\nexport class MyElement extends LitElement { render() { return html`Hello` } }\n" : authored)
    const main = framework === 'react' ? 'src/main.tsx' : 'src/main.ts'
    write(main, framework === 'react'
      ? "import './index.css'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\ncreateRoot(document.getElementById('app')!).render(<App />)\n"
      : framework === 'vue' ? "import './assets/main.css'\nimport { createApp } from 'vue'\nimport App from './App.vue'\ncreateApp(App).mount('#app')\n"
        : "import './my-element'\n")
    write('index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Installation fixture</title></head><body>${framework === 'lit' ? '<my-element></my-element>' : '<div id="app"></div>'}<script type="module" src="/${main}"></script></body></html>`)
    const command = deliveryFences(source).find(fence => fence.text.includes('npm create @master/css@rc'))!.text.trim()
    assert.equal(command, `npm create @master/css@rc -- --framework ${framework}${staticMode ? '' : ' --mode runtime'} --yes`)
    const plan = planMasterCSSSetup({ root, framework, mode: staticMode ? undefined : 'runtime', install: false, yes: true })
    applyMasterCSSSetupPlan(plan, { install: false })
    const config = readFileSync(join(root, 'vite.config.ts'), 'utf8')
    assert.ok(config.includes('@master/css-vite'))
    if (framework !== 'lit') assert.ok(config.includes(plugin), 'Existing framework plugin retained')
    assert.match(readFileSync(join(root, cssEntry), 'utf8'), /@import ['"]@master\/css['"]/)
    if (framework === 'lit') {
      const decorated = readFileSync(join(root, component), 'utf8')
      assert.ok(!decorated.includes('withMasterCSSRuntime'), 'Static Lit setup requires no runtime decorator')
      write(component, authored)
    }
    for (const name of [...packages, 'vite', '@master/css', '@master/css-vite', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(name.startsWith('@master/') ? join(repository, 'node_modules', name) : dependency(name), destination, 'dir')
    }
    const built = spawnSync(process.execPath, [join(repository, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: root, encoding: 'utf8', timeout: 40000 })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    const assets = readdirSync(join(root, 'dist/assets'))
    const css = assets.filter(file => file.endsWith('.css')).map(file => readFileSync(join(root, 'dist/assets', file), 'utf8')).join('\n')
    if (staticMode) {
      if (framework === 'lit') {
        const scripts = assets.filter(file => file.endsWith('.js')).map(file => readFileSync(join(root, 'dist/assets', file), 'utf8')).join('\n')
        assert.match(scripts, /background-color:var\(--color-blue\)/)
        assert.match(scripts, /padding-inline:var\(--spacing-md\)/)
      } else assert.match(css, /font-style:italic/)
      assert.ok(!assets.some(file => /\.wasm$|master-css-manifest|master-css-program/.test(file)), 'Static builds must not ship runtime assets')
    } else {
      assert.ok(assets.some(file => /master-css-program/.test(file)), 'Runtime program is emitted')
      assert.ok(!assets.some(file => file.endsWith('.wasm')), 'Browser runtime uses the JavaScript engine')
    }
    return { root: join(root, 'dist'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyFrameworkInstallationExamples() {
  for (const route of frameworkInstallationRoutes) frameworkInstallationFixture(route).dispose()
}
