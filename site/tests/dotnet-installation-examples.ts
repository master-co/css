import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { installationSource } from './installation-examples'
import { deliveryFences } from './delivery-examples'

const repository = fileURLToPath(new URL('../../', import.meta.url))
export const dotnetInstallationRoutes = ['/aspnet-core', '/aspnet-core/static-rendering', '/blazor', '/blazor/runtime-rendering', '/blazor/static-rendering'] as const

/** Builds the actual authored Vite assets. The local machine has no .NET SDK.
 * Razor tags below use explicit literal adapters: no Razor compilation, asset
 * fingerprinting, Blazor startup or enhanced-navigation coverage is claimed.
 */
export function dotnetInstallationFixture(route: typeof dotnetInstallationRoutes[number]) {
  const root = mkdtempSync(join(tmpdir(), 'master-dotnet-install-'))
  const source = installationSource(route)
  const fences = deliveryFences(source)
  const dispose = () => rmSync(root, { recursive: true, force: true })
  const write = (name: string, text: string) => { mkdirSync(dirname(join(root, name)), { recursive: true }); writeFileSync(join(root, name), text) }
  const file = (name: string) => {
    const fence = fences.find(fence => decodeURIComponent(fence.name ?? '') === name)
    assert.ok(fence, `${route}: missing ${name}`)
    const lines = fence.text.trimEnd().split('\n')
    const indent = Math.min(...lines.filter(line => line.trim()).map(line => line.match(/^ */)![0].length))
    return lines.map(line => line.slice(indent)).join('\n') + '\n'
  }
  try {
    const blazor = route.startsWith('/blazor')
    const isStatic = route.endsWith('/static-rendering')
    const layout = blazor ? 'Components/App.razor' : 'Pages/Shared/_Layout.cshtml'
    const view = blazor ? 'Components/Pages/Home.razor' : 'Pages/Index.cshtml'
    for (const name of ['vite.config.ts', 'package.json', 'src/main.ts', 'src/app.css', layout, view]) write(name, file(name))
    write('wwwroot/assets/keep.txt', 'existing host assets')
    for (const name of ['vite', '@master/css', '@master/css-vite', '@master/css-runtime']) {
      const destination = join(root, 'node_modules', name)
      mkdirSync(dirname(destination), { recursive: true })
      symlinkSync(join(repository, 'node_modules', name), destination, 'dir')
    }
    const scripts = JSON.parse(file('package.json')).scripts
    assert.equal(scripts['build:assets'], 'vite build')
    assert.equal(scripts['watch:assets'], 'vite build --watch')
    assert.match(source, /npm run build:assets\n\s*dotnet publish -c Release/)
    const built = spawnSync(process.execPath, [join(repository, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: root, encoding: 'utf8', timeout: 60000 })
    assert.equal(built.status, 0, `${route}: ${built.stderr}\n${built.stdout}`)
    assert.equal(readFileSync(join(root, 'wwwroot/assets/keep.txt'), 'utf8'), 'existing host assets')
    const output = join(root, 'wwwroot/master-css')
    const assets = readdirSync(output, { recursive: true }) as string[]
    const seen = new Set<string>()
    function readCSS(name: string): string {
      if (seen.has(name)) return ''
      seen.add(name)
      const css = readFileSync(join(output, name), 'utf8')
      return css + [...css.matchAll(/@import ["']\.\/([^"']+)["']/g)].map(([, dependency]) => readCSS(decodeURIComponent(dependency))).join('\n')
    }
    const css = readCSS('app.css')
    if (isStatic) {
      for (const declaration of ['font-style:italic', 'font-size:var(--font-size-3xl)', 'margin:var(--spacing-md)']) assert.ok(css.includes(declaration), `${route}: ${declaration}`)
      assert.ok(!assets.some(name => /\.wasm$|master-css-manifest/.test(name)))
    } else assert.ok(assets.some(name => name.endsWith('.wasm')))
    const viewSource = file(view)
    assert.match(viewSource, blazor ? /^@page "\/"/ : /^@page\s/)
    const viewHTML = viewSource.replace(/^@page[^\n]*\n/, '').replace(/<PageTitle>.*?<\/PageTitle>/, '')
    let html = file(layout)
    assert.doesNotMatch(html, /<html[^>]*\bhidden\b/)
    if (blazor) {
      for (const tag of ['<base href="/" />', '<ImportMap />', '<HeadOutlet />', '<Routes />', '@Assets["_framework/blazor.web.js"]']) assert.ok(html.includes(tag), tag)
      // Host tags are not executed. Preserve the actual utility entry, resolve
      // only known @Assets keys, and remove the unavailable Blazor script.
      html = html.replace(/<script src="@Assets\["_framework\/blazor.web.js"\]"><\/script>/, '')
        .replace(/<ImportMap \/>|<HeadOutlet \/>/g, '')
        .replace('<Routes />', viewHTML)
        .replace(/@Assets\["(master-css\/app\.(?:css|js))"\]/g, '$1')
        .replace('<base href="/" />', '<base href="/nested/" />')
    } else {
      assert.ok(html.includes('@await RenderSectionAsync("Scripts", required: false)'))
      html = html.replace('@RenderBody()', viewHTML)
        .replace('@await RenderSectionAsync("Scripts", required: false)', '')
        .replaceAll('~/master-css/', '/nested/master-css/')
        .replaceAll(' asp-append-version="true"', '')
    }
    assert.doesNotMatch(html, /@Assets|@Render|<Routes/)
    if (isStatic) assert.doesNotMatch(html, /<script[^>]+master-css/)
    write('wwwroot/index.html', html)
    return { root: join(root, 'wwwroot'), dispose }
  } catch (error) { dispose(); throw error }
}

export function verifyDotnetInstallationExamples() {
  for (const route of dotnetInstallationRoutes) dotnetInstallationFixture(route).dispose()
}
