import { execFileSync } from 'node:child_process'
import { createServer, type Server } from 'node:http'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, extname, join, normalize, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from '@playwright/test'
import { describe, expect, it } from 'vitest'
import webpack from 'webpack'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const require = createRequire(import.meta.url)
let built = false

function buildPackage() {
  if (built) return
  execFileSync('pnpm', ['--dir', packageDir, 'build'], {
    cwd: packageDir,
    env: {
      ...process.env,
      CI: 'true'
    },
    shell: process.platform === 'win32',
    stdio: 'pipe',
    timeout: 120000
  })
  built = true
}

function createFixture(root: string) {
  const baseCSS = readFileSync(require.resolve('@master/css/base.css'), 'utf-8')
  writeFileSync(join(root, 'entry.js'), 'console.log("webpack runtime fixture")\n')
  writeFileSync(join(root, 'app.css'), [
    '@master entry;',
    '@import "@master/css";',
    ''
  ].join('\n'))
  return {
    html: '<!doctype html><html><head><link rel="stylesheet" href="./global.css"></head><body><main id="probe" class="box block">Probe</main></body></html>',
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
    webpack(config, (error, stats) => {
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
    buildPackage()
    const root = mkdtempSync(join(tmpdir(), 'master-css-webpack-runtime-'))
    const dist = join(root, 'dist')
    const fixture = createFixture(root)
    const MasterCSSPlugin = (await import(`${pathToFileURL(join(packageDir, 'dist/index.js')).href}?${Date.now()}`)).default
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
          new MasterCSSPlugin({ mode: 'runtime' }, root),
          new EmitFixtureAssetsPlugin(fixture.html, fixture.css)
        ]
      })

      const html = readFileSync(join(dist, 'index.html'), 'utf-8')
      expect(html).toContain('<link rel="preload" as="script" href="./master-css-runtime.js">')
      expect(html).toContain('<link rel="modulepreload" as="json" crossorigin href="./master-css-manifest.')
      expect(html).toContain('<script defer src="./master-css-runtime.js"></script></body>')

      const served = await serveDirectory(dist)
      server = served.server
      browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(served.url)
      await page.waitForSelector('#probe')
      await page.waitForFunction(() => getComputedStyle(document.getElementById('probe')!).display === 'block')

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
