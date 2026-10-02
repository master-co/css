import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { extname, join, normalize, relative } from 'node:path'
import { chromium, type Browser } from '@playwright/test'
import { describe, expect, it } from 'vitest'
import webpack from 'webpack'
import MasterCSSWebpackPlugin from '../dist/index.js'

const require = createRequire(import.meta.url)

function createFixture(root: string) {
  const baseCSS = readFileSync(require.resolve('@master/css/base.css'), 'utf-8')
  writeFileSync(join(root, 'entry.js'), 'console.log("webpack runtime fixture")\n')
  writeFileSync(join(root, 'app.css'), "@import \"@master/css\";\n@import \"@master/css\";\n")
  return {
    html: '<!doctype html><html><head><link rel="stylesheet" href="./global.css"></head><body><main id="probe" class="box display:block">Probe</main></body></html>',
    css: [
      baseCSS,
      '',
      '@layer components {',
      '    .box { display: flex; }',
      '}',
      ''
    ].join('\n')
  }
}

class EmitFixtureAssetsPlugin {
  constructor(private html: string, private css: string) {}

  apply(compiler: webpack.Compiler) {
    compiler.hooks.thisCompilation.tap('EmitFixtureAssetsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap({
        name: 'EmitFixtureAssetsPlugin',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, () => {
        compilation.emitAsset('index.html', new compiler.webpack.sources.RawSource(this.html))
        compilation.emitAsset('global.css', new compiler.webpack.sources.RawSource(this.css))
      })
    })
  }
}

function runWebpack(config: webpack.Configuration) {
  return new Promise<void>((resolve, reject) => {
    // Test published exports without inheriting the monorepo's source aliases.
    webpack({ ...config, resolve: { ...config.resolve, tsconfig: false } }, (error, stats) => {
      if (error) {
        reject(error)
        return
      }
      if (stats?.hasErrors()) {
        reject(new Error(stats.toString({ all: false, errors: true })))
        return
      }
      resolve()
    })
  })
}

function getContentType(pathname: string) {
  switch (extname(pathname)) {
    case '.css':
      return 'text/css; charset=utf-8'
    case '.html':
      return 'text/html; charset=utf-8'
    case '.js':
      return 'text/javascript; charset=utf-8'
    case '.json':
      return 'application/json; charset=utf-8'
    default:
      return 'application/octet-stream'
  }
}

function serveDirectory(root: string) {
  const server = createServer(async (request, response) => {
    const requestURL = new URL(request.url || '/', 'http://127.0.0.1')
    const pathname = requestURL.pathname === '/' ? '/index.html' : requestURL.pathname
    const filePath = normalize(join(root, pathname))
    if (relative(root, filePath).startsWith('..')) {
      response.statusCode = 403
      response.end()
      return
    }
    try {
      response.setHeader('Content-Type', getContentType(filePath))
      response.end(await readFile(filePath))
    } catch {
      response.statusCode = 404
      response.end()
    }
  })

  return new Promise<{ server: Server, url: string }>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to start test server.'))
        return
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}`
      })
    })
  })
}

describe('Webpack runtime mode', () => {
  it('injects runtime assets and preserves utility layer precedence over global CSS', async () => {
    const root = mkdtempSync(join(tmpdir(), 'master-css-webpack-runtime-'))
    const dist = join(root, 'dist')
    const fixture = createFixture(root)
    let browser: Browser | undefined
    let server: Server | undefined

    try {
      await runWebpack({
        mode: 'production',
        context: root,
        entry: './entry.js',
        output: {
          path: dist,
          filename: '[name].js',
          chunkFilename: '[name].js',
          publicPath: './'
        },
        plugins: [
          new MasterCSSWebpackPlugin({ mode: 'runtime' }, root),
          new EmitFixtureAssetsPlugin(fixture.html, fixture.css)
        ]
      })

      const served = await serveDirectory(dist)
      server = served.server
      browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(served.url)
      await page.waitForSelector('#probe')
      await page.waitForFunction(() => getComputedStyle(document.getElementById('probe')!).display === 'block')
      expect(await page.locator('script[defer][src="./master-css-runtime.js"]').count()).toBe(1)
      expect(await page.locator('link[rel="preload"][as="script"][href="./master-css-runtime.js"]').count()).toBe(1)

      const manifestPreload = page.locator('link[rel="modulepreload"][as="json"][href^="./master-css-manifest."]')
      expect(await manifestPreload.count()).toBe(1)
      expect(await manifestPreload.getAttribute('crossorigin')).toBe('')

      const state = await page.evaluate(() => {
        const globalCSS = document.head.querySelector('link[rel="stylesheet"]')
        const runtimeStyle = document.getElementById('master-css')
        const runtimeScript = document.body.querySelector('script[src$="master-css-runtime.js"]')
        const headChildren = Array.from(document.head.children)
        return {
          display: getComputedStyle(document.getElementById('probe')!).display,
          hasRuntimePreload: Boolean(document.head.querySelector('link[rel="preload"][as="script"][href$="master-css-runtime.js"]')),
          hasManifestPreload: Boolean(document.head.querySelector('link[rel="modulepreload"][as="json"][href*="master-css-manifest."]')),
          runtimeStyleAfterGlobalCSS: Boolean(globalCSS && runtimeStyle && headChildren.indexOf(globalCSS) < headChildren.indexOf(runtimeStyle)),
          runtimeScriptIsLastBodyElement: document.body.lastElementChild === runtimeScript
        }
      })

      expect(state).toEqual({
        display: 'block',
        hasRuntimePreload: true,
        hasManifestPreload: true,
        runtimeStyleAfterGlobalCSS: true,
        runtimeScriptIsLastBodyElement: true
      })
    } finally {
      await browser?.close()
      await new Promise<void>((resolve) => server?.close(() => resolve()) ?? resolve())
      rmSync(root, { recursive: true, force: true })
    }
  }, 180000)
})

it('delivers dynamic keyframes through writable final CSS assets', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-webpack-owned-'))
  const dist = join(root, 'dist')
  let browser: Browser | undefined
  let server: Server | undefined
  try {
    writeFileSync(join(root, 'entry.js'), 'import "./app.css"')
    writeFileSync(join(root, 'app.css'), '@import "@master/css";@prune native;@theme{--animate-probe:probe 1ms both}@layer{@keyframes probe{to{opacity:.3;background-image:url("./pixel.svg")}}}')
    writeFileSync(join(root, 'pixel.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    const plugin = new MasterCSSWebpackPlugin({ mode: 'runtime' }, root)
    await runWebpack({
      mode: 'production', context: root, entry: './entry.js', experiments: { css: true },
      output: { path: dist, filename: 'main.js', cssFilename: 'main.css', publicPath: '/' },
      plugins: [plugin, new EmitFixtureAssetsPlugin('<html><head><link rel="stylesheet" href="/main.css"></head><body><div id="probe"></div></body></html>', '')]
    })
    expect(JSON.parse(readFileSync(join(dist, 'main.css.master-css.json'), 'utf8')).version).toBe(1)
    const served = await serveDirectory(dist)
    server = served.server
    browser = await chromium.launch()
    const page = await browser.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(served.url)
    await page.waitForFunction(() => Boolean((globalThis as any).masterCSSRuntime))
    await page.locator('#probe').evaluate(element => element.setAttribute('class', 'animate-probe'))
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity), { timeout: 10000 }).toBe('0.3')
    expect(await page.locator('#master-css').evaluate(element => [...(element as HTMLStyleElement).sheet!.cssRules].map(rule => rule.cssText).join(''))).not.toContain('@keyframes')
    const image = await page.locator('#probe').evaluate(element => getComputedStyle(element).backgroundImage)
    expect(image).toContain('.svg')
    expect(image).not.toContain('/pixel.svg')
    await page.locator('#probe').evaluate(element => element.removeAttribute('class'))
    await expect.poll(() => page.locator('#probe').evaluate(element => getComputedStyle(element).opacity)).toBe('1')
    expect(errors).toEqual([])
  } finally {
    await browser?.close()
    await new Promise<void>(resolve => server?.close(() => resolve()) ?? resolve())
    rmSync(root, { recursive: true, force: true })
  }
}, 180000)
