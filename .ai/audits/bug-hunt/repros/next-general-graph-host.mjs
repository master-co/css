import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = resolve(process.env.BH_NEXT_PACKAGE_DIR || fileURLToPath(new URL('../../../../packages/next/', import.meta.url)))
const requireNext = createRequire(join(packageDir, 'package.json'))
const requireRuntime = createRequire(new URL('../../../../packages/runtime/package.json', import.meta.url))
const browsers = requireRuntime('@playwright/test')
const parent = join(packageDir, 'e2e');mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'bug-hunt-general-graph-')), observations = []
let server, remote
try {
  remote = createServer((_request, response) => { response.setHeader('content-type', 'text/css');response.end('.external{color:rgb(21,34,55)}') })
  remote.listen(0, '127.0.0.1');await once(remote, 'listening')
  const externalURL = `http://127.0.0.1:${remote.address().port}/remote.css?audit=1`

  mkdirSync(join(root, 'app/nested/assets'), { recursive: true })
  mkdirSync(join(root, 'app/assets'))
  writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}')
  writeFileSync(join(root, 'next.config.js'), `import { withMasterCSS } from ${JSON.stringify(relative(root, join(packageDir, 'dist/index.js')))};export default await withMasterCSS(${JSON.stringify({output:'export',productionBrowserSourceMaps:Boolean(process.env.BH_NEXT_SOURCE_MAPS),experimental:{cpus:1,...(process.env.BH_NEXT_LIGHTNINGCSS ? {useLightningcss:true} : {})},...(process.env.BH_NEXT_WORKSPACE_ROOT ? {turbopack:{root:process.env.BH_NEXT_WORKSPACE_ROOT}} : {})})},{mode:'runtime',runtime:false});`)
  if (process.env.BH_NEXT_PURE) writeFileSync(join(root, 'next.config.js'), `export default ${JSON.stringify({output:'export',productionBrowserSourceMaps:Boolean(process.env.BH_NEXT_SOURCE_MAPS),experimental:{cpus:1,...(process.env.BH_NEXT_LIGHTNINGCSS ? {useLightningcss:true} : {})},...(process.env.BH_NEXT_WORKSPACE_ROOT ? {turbopack:{root:process.env.BH_NEXT_WORKSPACE_ROOT}} : {})})};`)
  if (process.env.BH_NEXT_EXTERNAL_IMPORTS || process.env.BH_NEXT_CSS_LOADER) {
    const file = join(root, 'next.config.js')
    const configuration = readFileSync(file, 'utf8').replace('export default ', 'const config = ')
    writeFileSync(file, configuration + `
const configure = config.webpack;
config.webpack = (...args) => {
  const value = configure ? configure(...args) : args[0];
  const visit = rules => { for (const rule of rules || []) {
    if (!rule || typeof rule !== 'object') continue;
    visit(rule.rules);visit(rule.oneOf);
    for (const use of Array.isArray(rule.use) ? rule.use : []) {
      if (!use || typeof use !== 'object' || !(String(use.loader).includes('/css-loader/') || String(use.loader).includes('/lightningcss-loader/'))) continue;
      const original = use.options?.import;
      use.options = { ...use.options, import: (...args) => /^https?:/.test(args[0]) ? true : typeof original === 'function' ? original(...args) : original ?? true };
      ${process.env.BH_NEXT_CSS_LOADER ? `use.loader = ${JSON.stringify(process.env.BH_NEXT_CSS_LOADER)};
      delete use.options.postcss;delete use.options.deploymentId;
      if (typeof use.options.import === 'function') use.options.import = { filter: use.options.import };
      if (typeof use.options.url === 'function') use.options.url = { filter: use.options.url };
      if (use.options.modules && typeof use.options.modules === 'object') use.options.modules = { ...use.options.modules, namedExport: false };` : ''}

    }
  } };
  visit(value.module?.rules);return value;
};
export default config;
`)
  }
  writeFileSync(join(root, 'app/layout.jsx'), 'import "./globals.css";export default function Layout({children}){return <html><body>{children}</body></html>}')
  writeFileSync(join(root, 'app/page.jsx'), 'export default function Page(){return <main><div id="direct" className="direct">Direct</div><div id="nested" className="nested">Nested</div><div id="generated" className="composed">Generated</div><div id="external" className="external">External</div></main>}')
  const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><path fill="${color}" d="M0 0h4v4H0z"/></svg>`
  writeFileSync(join(root, 'app/assets/red.svg'), svg('red'))
  writeFileSync(join(root, 'app/nested/assets/blue.svg'), svg('blue'))
  writeFileSync(join(root, 'app/nested/child.css'), '.nested{width:4px;height:4px;background-image:url("./assets/blue.svg?nested=1#pixel")}')
  writeFileSync(join(root, 'app/globals.css'), `@master entry;@preserve native;@import "${externalURL}" layer(remote) supports(display:grid) screen;@import "./nested/child.css" layer(card);.direct{width:4px;height:4px;background-image:url("./assets/red.svg?direct=1#pixel")}.composed{@compose p:2rem;}`)
  if (process.env.BH_NEXT_PURE) { const file = join(root, 'app/globals.css');writeFileSync(file, readFileSync(file, 'utf8').replace('@master entry;@preserve native;', '').replace('@compose p:2rem;', 'padding:2rem;')) }
  const moduleKind = process.env.BH_NEXT_MODULE
  const globalParent = Boolean(process.env.BH_NEXT_IMPORT_GLOBAL_PARENT)
  const expectedImportScoped = process.env.BH_NEXT_BUNDLER === 'webpack' ? !globalParent : !process.env.BH_NEXT_MODULE_IMPORT_PLAIN
  if (moduleKind) {
    assert(['entry', 'local', 'pure', 'icss'].includes(moduleKind), 'supported module control')
    writeFileSync(join(root, 'app/globals.css'), moduleKind === 'pure' ? '' : '@master entry;')
    let moduleSource = (moduleKind === 'entry' ? '@master entry;@preserve native;' : '') + '.direct{width:4px;height:4px;background-image:url("./assets/red.svg?direct=1#pixel")}.composed{' + (moduleKind === 'pure' ? 'padding:2rem;' : '@compose p:2rem;') + '}'
    if (process.env.BH_NEXT_MODULE_FEATURE === 'composes') {
      moduleSource = moduleSource.replace('.composed{', '.composed{composes:shared from "./base.module.css";composes:globalPad from global;')
      writeFileSync(join(root, 'app/base.module.css'), '.shared{border-top:7px solid rgb(12,34,56)}')
      const globalFile = join(root, 'app/globals.css')
      writeFileSync(globalFile, readFileSync(globalFile, 'utf8') + '.globalPad{margin-left:11px}')
    }
    if (process.env.BH_NEXT_MODULE_FEATURE === 'icss-value') {
      moduleSource = ':import("./tokens.module.css"){tone:tone;}' + moduleSource.replace('.direct{', '.direct{color:tone;')
      writeFileSync(join(root, 'app/tokens.module.css'), ':export{tone:#123456}')
    }
    if (process.env.BH_NEXT_MODULE_FEATURE === 'imports') {
      const importedName = process.env.BH_NEXT_MODULE_IMPORT_PLAIN ? 'imported.css' : 'imported.module.css'
      moduleSource = '@import ' + JSON.stringify('./nested/' + importedName) + ';' + moduleSource
      writeFileSync(join(root, 'app/nested', importedName), '.imported{margin-left:13px;width:4px;height:4px;background-image:url("./assets/blue.svg")}')
    }
    writeFileSync(join(root, 'app/card.module.css'), moduleSource)
    if (moduleKind === 'icss') {
      writeFileSync(join(root, 'app/globals.css'), '.icss_direct{width:4px;height:4px;background-image:url("./assets/red.svg?direct=1#pixel")}.icss_composed{padding:2rem}')
      writeFileSync(join(root, 'app/card.module.css'), ':export{direct:icss_direct;composed:icss_composed}')
    }
    writeFileSync(join(root, 'app/page.jsx'), 'import styles from "./card.module.css";export default function Page(){return <main><div id="direct" className={styles.direct}>Direct</div><div id="generated" className={styles.composed}>Generated</div></main>}')
  }
  if (globalParent) {
    writeFileSync(join(root, 'app/globals.css'), readFileSync(join(root, 'app/card.module.css'), 'utf8'))
    writeFileSync(join(root, 'app/page.jsx'), 'export default function Page(){return <main><div id="direct" className="direct">Direct</div><div id="generated" className="composed">Generated</div></main>}')
  }
  if (process.env.BH_NEXT_MODULE_FEATURE === 'imports') {
    const file = join(root, 'app/page.jsx')
    writeFileSync(file, readFileSync(file, 'utf8').replace('</main>', '<div id="leak" className="imported">Leak</div><div id="graph-child">Child</div></main>'))
  }
  if (process.env.BH_NEXT_PURE_LOADER_MAP) {
    assert(process.env.BH_NEXT_PURE && moduleKind === 'pure', 'identity-map control requires pure Next Module input')
    writeFileSync(join(root, 'identity-map.cjs'), 'module.exports=function(source){this.callback(null,source,{version:3,sources:[this.resourcePath],sourcesContent:[source],names:[],mappings:"AAAA"})}')
    const file = join(root, 'next.config.js')
    writeFileSync(file, readFileSync(file, 'utf8').replace('export default ', 'const config = ') + '\nconfig.turbopack={...config.turbopack,rules:{"*.module.css":{loaders:["./identity-map.cjs"],type:"css-module",as:"*.module.css"}}};export default config;')
  }
  const authoredStylesheets = []
  function captureAuthored(directory) {
    for (const name of readdirSync(directory)) {
      const file = join(directory, name)
      if (statSync(file).isDirectory()) captureAuthored(file)
      else if (/\.(css|scss|sass)$/.test(name)) authoredStylesheets.push({ file: relative(root, file).replace(/\\/g, '/'), text: readFileSync(file, 'utf8') })
    }
  }
  captureAuthored(join(root, 'app'))
  const child = spawn(process.execPath, [requireNext.resolve('next/dist/bin/next'), 'build', ...(process.env.BH_NEXT_BUNDLER === 'webpack' ? ['--webpack'] : [])], {
    cwd: root, env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', bytes => process.stdout.write(bytes))
  child.stderr.on('data', bytes => process.stderr.write(bytes))
  const timeout = setTimeout(() => child.kill('SIGTERM'), 180000)
  const [code, signal] = await once(child, 'exit');clearTimeout(timeout)
  assert.equal(code, 0, `Next build failed; signal=${signal}`)
  const output = join(root, 'out')
  const files = []
  function inventory(directory) {
    for (const name of readdirSync(directory)) {
      const file = join(directory, name)
      if (statSync(file).isDirectory()) inventory(file)
      else files.push({ file: relative(output, file), sha256: createHash('sha256').update(readFileSync(file)).digest('hex') })
    }
  }
  inventory(output)
  const stylesheets = files.filter(({ file }) => file.endsWith('.css') || file.endsWith('.css.map')).map(({ file }) => ({ file, text: readFileSync(join(output, file), 'utf8') }))
  let importedSelector
  if (process.env.BH_NEXT_MODULE_FEATURE === 'imports') {
    const postcss = createRequire(requireNext.resolve('next/package.json'))('postcss')
    for (const asset of stylesheets) if (asset.file.endsWith('.css')) postcss.parse(asset.text).walkDecls('margin-left', declaration => {
      if (declaration.value === '13px') importedSelector = declaration.parent.selector
    })
  }
  server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = resolve(output, '.' + (pathname === '/' ? '/index.html' : pathname))
    if (!file.startsWith(output + '/') || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404);response.end();return }
    response.setHeader('content-type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' })[extname(file)] || 'application/octet-stream')
    response.end(readFileSync(file))
  })
  server.listen(0, '127.0.0.1');await once(server, 'listening')
  const url = `http://127.0.0.1:${server.address().port}/`
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const browser = await browsers[name].launch({ headless: true })
    try {
      const page = await browser.newPage()
      await page.goto(url, { waitUntil: 'networkidle' })
      for (const [id, color] of moduleKind ? [['direct', 'red']] : [['direct', 'red'], ['nested', 'blue']]) {
        const result = await page.evaluate(async id => {
          const background = getComputedStyle(document.getElementById(id)).backgroundImage
          const match = background.match(/url\(["']?([^"')]+)["']?\)/)
          if (!match) return { background }
          const image = new Image();image.src = match[1];try { await image.decode() } catch (error) { return { background, url: match[1], decodeError: String(error) } }
          const response = await fetch(match[1])
          return { background, status: response.status, width: image.naturalWidth, height: image.naturalHeight, body: await response.text() }
        }, id)
        observations.push({ browser: name, id, ...result, pass: result.status === 200 && result.width === 4 && result.height === 4 && Boolean(result.body?.includes(`fill="${color}"`)) })
      }
      if (process.env.BH_NEXT_MODULE_FEATURE === 'imports') {
        const leak = await page.locator('#leak').evaluate(element => ({ margin: getComputedStyle(element).marginLeft, background: getComputedStyle(element).backgroundImage }))
        observations.push({ browser: name, id: 'import-scope-policy', ...leak, expectedImportScoped, pass: expectedImportScoped ? leak.margin === '0px' && leak.background === 'none' : leak.margin === '13px' && leak.background !== 'none' })
        const selector = importedSelector
        observations.push({ browser: name, id: 'retained-import-scope', selector, pass: Boolean(selector && /^\.[\w-]+$/.test(selector) && (expectedImportScoped ? selector !== '.imported' : selector === '.imported')) })
        const child = await page.locator('#graph-child').evaluate(async (element, selector) => {
          if (!selector || !/^\.[\w-]+$/.test(selector)) return { error: 'Missing single-class imported fixture rule' }
          element.className = selector.slice(1)
          const style = getComputedStyle(element), match = style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)
          if (!match) return { margin: style.marginLeft, background: style.backgroundImage }
          const image = new Image();image.src = match[1]
          try { await image.decode() } catch (error) { return { error: String(error) } }
          const response = await fetch(match[1])
          return { margin: style.marginLeft, status: response.status, width: image.naturalWidth, height: image.naturalHeight, body: await response.text() }
        }, selector)
        observations.push({ browser: name, id: 'retained-import-resource', ...child, pass: child.margin === '13px' && child.status === 200 && child.width === 4 && child.height === 4 && Boolean(child.body?.includes('fill="blue"')) })
      }
      if (process.env.BH_NEXT_MODULE_FEATURE === 'icss-value') {
        const color = await page.locator('#direct').evaluate(element => getComputedStyle(element).color)
        observations.push({ browser: name, id: 'imported-icss-value', color, pass: color === 'rgb(18, 52, 86)' })
      }
      const padding = await page.locator('#generated').evaluate(element => getComputedStyle(element).paddingTop)
      observations.push({ browser: name, id: 'generated', padding, pass: padding === '32px' })
      if (moduleKind) {
        const classes = await page.locator('#direct').getAttribute('class')
        observations.push({ browser: name, id: globalParent ? 'global-entry-class' : 'module-export', classes, pass: globalParent ? classes === 'direct' : Boolean(classes && classes !== 'direct') })
        if (process.env.BH_NEXT_MODULE_FEATURE === 'composes') {
          const composition = await page.locator('#generated').evaluate(element => ({ classes: element.className, border: getComputedStyle(element).borderTopWidth, margin: getComputedStyle(element).marginLeft }))
          observations.push({ browser: name, id: 'cross-file-composes', ...composition, pass: composition.border === '7px' })
          observations.push({ browser: name, id: 'global-composes', ...composition, pass: composition.margin === '11px' && composition.classes.split(/\s+/).includes('globalPad') })
        }
      } else {
        const color = await page.locator('#external').evaluate(element => getComputedStyle(element).color)
        observations.push({ browser: name, id: 'external', color, pass: color === 'rgb(21, 34, 55)' })
      }
    } finally { await browser.close() }
  }
  const report = { globalParent, expectedImportScoped, importedPlainCSS: Boolean(process.env.BH_NEXT_MODULE_IMPORT_PLAIN), authoredStylesheets, pureLoaderMap: Boolean(process.env.BH_NEXT_PURE_LOADER_MAP), moduleFeature: process.env.BH_NEXT_MODULE_FEATURE ?? null, moduleKind: moduleKind ?? null, sourceMaps: Boolean(process.env.BH_NEXT_SOURCE_MAPS), cssLoaderControl: process.env.BH_NEXT_CSS_LOADER ?? null, externalImportControl: Boolean(process.env.BH_NEXT_EXTERNAL_IMPORTS), pureNext: Boolean(process.env.BH_NEXT_PURE), lightningcss: Boolean(process.env.BH_NEXT_LIGHTNINGCSS), bundler: process.env.BH_NEXT_BUNDLER ?? 'turbopack', scope: 'Actual Next export (managed general loader mode:runtime/runtime:false, or explicit pure-Next control), then three-browser SVG decoding, composed padding and qualified external CSS rendering. No live HMR or dynamic SSR claim.', observations, files, stylesheets }
  if (process.env.BH_NEXT_HOST_EVIDENCE) writeFileSync(process.env.BH_NEXT_HOST_EVIDENCE, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
  assert.ok(observations.every(result => result.pass), 'Some actual browser delivery checks failed')
} finally {
  if (server) await new Promise(resolveClose => server.close(resolveClose))
  if (remote) await new Promise(resolveClose => remote.close(resolveClose))
  rmSync(root, { recursive: true, force: true })
}
