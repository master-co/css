import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const storybookModes = ['app-runtime', 'app-static', 'preview-runtime'] as const

/** Storybook is not installed. Build the authored story and preview with real
 * React/Vite, and execute the documented viteFinal hook against a base config.
 * The small React mounting adapter is not Storybook's builder, manager or CSF loader.
 */
export function storybookInstallationFixture(mode: typeof storybookModes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-storybook-install-'))
  const source = installationSource('/storybook')
  const fences = deliveryFences(source)
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  try {
    for (const name of ['vite.config.ts', '.storybook/main.ts', '.storybook/preview.ts', 'src/index.css', 'src/Hello.stories.tsx']) {
      const fence = fences.find(fence => fence.name === name)
      assert.ok(fence, name)
      const lines = fence.text.trimEnd().split('\n')
      const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
      let text = lines.map(line => line.slice(indent)).join('\n') + '\n'
      if (name === 'vite.config.ts' && mode === 'app-static') {
        assert.ok(source.includes("masterCSS({ mode: 'static' })"))
        text = text.replace('masterCSS()', "masterCSS({ mode: 'static' })")
      }
      if (name === 'vite.config.ts' && mode === 'preview-runtime') text = text.replace("import masterCSS from '@master/css-vite'\n", '').replace('react(), masterCSS()', 'react()')
      write(name, text)
    }
    write('package.json', JSON.stringify({ type: 'module' }))
    write('tsconfig.json', JSON.stringify({ compilerOptions: { jsx: 'react-jsx' } }))
    for (const name of ['vite', '@master/css', '@master/css-vite', '@master/css-runtime', 'react', 'react-dom', '@vitejs/plugin-react']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      const store = join(repository, 'node_modules/.pnpm')
      const match = readdirSync(store).find(value => value.startsWith(name.replace('/', '+') + '@'))
      const dependency = name === 'vite' || name.startsWith('@master/') ? join(repository, 'node_modules', name) : join(store, match!, 'node_modules', name)
      symlinkSync(dependency, destination, 'dir')
    }
    write('src/fixture.tsx', "import '../.storybook/preview'\nimport { createRoot } from 'react-dom/client'\nimport story from './Hello.stories'\ncreateRoot(document.getElementById('app')!).render(story.render())\n")
    write('index.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Story asset fixture</title></head><body><div id="app"></div><script type="module" src="/src/fixture.tsx"></script></body></html>')
    write('build.mjs', `import { build, loadConfigFromFile } from 'vite'
const env = { command: 'build', mode: 'production' }
let config = (await loadConfigFromFile(env, './vite.config.ts')).config
${mode === 'preview-runtime' ? "const storybook = (await loadConfigFromFile(env, './.storybook/main.ts')).config\nconfig = await storybook.viteFinal(config)" : ''}
await build({ ...config, configFile: false })
`)
    const built = spawnSync(process.execPath, ['build.mjs'], { cwd: root, encoding: 'utf8', timeout: 60000 })
    assert.equal(built.status, 0, `${mode}: ${built.stderr}\n${built.stdout}`)
    const output = join(root, 'dist')
    const assets = readdirSync(join(output, 'assets'))
    if (mode === 'app-static') {
      const css = assets.filter(name => name.endsWith('.css')).map(name => readFileSync(join(output, 'assets', name), 'utf8')).join('\n')
      assert.match(css, /font-style:italic/)
      assert.ok(!assets.some(name => /\.wasm$|master-css-manifest/.test(name)))
    } else assert.ok(assets.some(name => name.endsWith('.wasm')))
    return { root: output, dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyStorybookInstallationExamples() {
  for (const mode of storybookModes) storybookInstallationFixture(mode).dispose()
}
