import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const packageBase = process.env.BH_NEXT_PACKAGE_DIR ? pathToFileURL(resolve(process.env.BH_NEXT_PACKAGE_DIR) + '/') : new URL('../../../../packages/next/', import.meta.url)
const { prepareNextStatic, transformStaticStyleSource } = await import(new URL('dist/static.js', packageBase))
const { default: nextLoader } = await import(new URL('dist/stylesheet-loader.js', packageBase))

function readCSSGraph(file, result = new Map()) {
  if (result.has(file)) return result
  const css = readFileSync(file, 'utf8');result.set(file, css)
  for (const [, href] of css.matchAll(/@import\s+["']([^"']+)["']/g)) if (href.startsWith('.')) readCSSGraph(fileURLToPath(new URL(href, pathToFileURL(file))), result)
  return result
}

const results = []
for (const kind of ['plain', 'direct-resource', 'imported-resource', 'external-import']) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'next-static-resource-')))
  const app = join(root, 'app'), entry = join(app, 'globals.css')
  const assetBase = kind === 'imported-resource' ? join(app, 'nested') : app
  mkdirSync(join(assetBase, 'assets'), { recursive: true })
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><path fill="red" d="M0 0h4v4H0z"/></svg>'
  writeFileSync(join(assetBase, 'assets/pixel.svg'), svg)
  const native = '.probe{width:4px;height:4px;background-image:url("./assets/pixel.svg?audit=1#pixel")}'
  writeFileSync(join(assetBase, 'child.css'), native)
  const source = '@master entry;@preserve native;' + (kind === 'plain' ? '.probe{color:red}' : kind === 'direct-resource' ? native : kind === 'imported-resource' ? '@import "./nested/child.css" layer(card);' : '@import "https://example.invalid/theme.css" layer(remote);.probe{color:red}')
  writeFileSync(entry, source)
  const row = { kind, root }
  try {
    const dependencies = []
    row.normalLoader = await new Promise((resolveResult, reject) => nextLoader.call({ resourcePath: entry, rootContext: root,
      addDependency: file => dependencies.push(file), async: () => (error, css) => error ? reject(error) : resolveResult({ css, dependencies }) }, source)).catch(error => ({ error: String(error), dependencies }))
    row.normalResources = [...(row.normalLoader.css ?? "").matchAll(/url\(["']?([^"')]+)["']?\)/g)].filter(([, url]) => !/^[a-z]+:/i.test(url)).map(([, url]) => {
      const file = resolve(dirname(entry), decodeURIComponent(url.split(/[?#]/)[0]))
      return { url, file, exists: existsSync(file) }
    })
    row.normalPass = !row.normalLoader.error && (kind === 'plain' ? /color\s*:\s*red/.test(row.normalLoader.css)
      : kind === 'external-import' ? row.normalLoader.css.includes('https://example.invalid/theme.css')
      : row.normalResources.length > 0 && row.normalResources.every(resource => resource.exists))
    const state = await prepareNextStatic({ mode: 'static' }, { projectDir: root })
    row.staticLoader = await transformStaticStyleSource(state.statePath, entry, source)
    row.generatedCSS = readFileSync(state.outputPath, 'utf8')
    row.generatedFiles = readdirSync(dirname(state.outputPath))
    const graph = readCSSGraph(state.outputPath)
    row.stylesheets = [...graph].map(([file, css]) => ({ file, css }))
    row.resources = [...graph].flatMap(([owner, css]) => [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(([, url]) => {
      const file = resolve(dirname(owner), decodeURIComponent(url.split(/[?#]/)[0]))
      return { url, file, exists: existsSync(file) }
    }))
    const completeCSS = [...graph.values()].join('\n')
    row.staticPass = kind === 'plain' ? /color\s*:\s*red/.test(completeCSS) : kind === 'external-import' ? (row.staticLoader + completeCSS).includes('https://example.invalid/theme.css') : row.resources.length > 0 && row.resources.every(resource => resource.exists)
    row.pass = row.normalPass && row.staticPass
  } catch (error) { row.error = String(error);row.staticPass = false;row.pass = false }
  finally {
    const sessions = globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__
    if (sessions) for (const [key, session] of sessions) if (key.startsWith(root + '\0')) {
      await session.scanner.dispose()
      session.stylesheets.dispose()
      sessions.delete(key)
    }
    rmSync(root, { recursive: true, force: true })
  }
  results.push(row)
}
console.log(JSON.stringify({ scope: 'Actual delivered Next stylesheet/static functions with owned source files; validates local CSS resource references before Next bundling. Not a full Next build or browser claim.', results }, null, 2))
if (results.some(row => !row.pass)) process.exitCode = 1
