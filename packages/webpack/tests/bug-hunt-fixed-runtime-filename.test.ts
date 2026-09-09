import { expect, test } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import webpack from 'webpack'
import Plugin from '../dist/index.js'

test.each([
  { label: 'fixed', filename: 'bundle.js', app: /^bundle\.js$/ },
  { label: 'nested fixed', filename: 'js/bundle.js', app: /^js\/bundle\.js$/ },
  { label: 'build hash', filename: 'bundle.[fullhash:8].js', app: /^bundle\.[a-f0-9]{8}\.js$/ },
  { label: 'callback fixed', filename: () => 'bundle.js', app: /^bundle\.js$/ },
  { label: 'name control', filename: 'js/[name].js', app: /^js\/main\.js$/ },
  { label: 'content hash control', filename: 'js/[contenthash:8].js', app: /^js\/[a-f0-9]{8}\.js$/ }
])('BH-0030 preserves the app filename and emits a separate runtime: $label', async ({ filename, app }) => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-webpack-filename-'))
  try {
    writeFileSync(join(root, 'entry.js'), 'globalThis.__APP_FILENAME_PROBE__ = true')
    writeFileSync(join(root, 'app.css'), '@master entry;\n@import "@master/css";')
    const stats = await new Promise<webpack.Stats>((resolve, reject) => webpack({
      mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false },
      output: { path: join(root, 'dist'), filename, chunkFilename: '[name].js', publicPath: 'auto' },
      plugins: [new Plugin({ mode: 'runtime' }, root)]
    }, (error, stats) => {
      if (error || !stats || stats.hasErrors()) reject(error || new Error(stats?.toString({ all: false, errors: true })))
      else resolve(stats)
    }))
    const entries = stats.toJson({ all: false, entrypoints: true }).entrypoints!
    const appFile = entries.main.assets!.find(asset => asset.name.endsWith('.js'))!.name
    const runtimeFile = entries['master-css-runtime'].assets!.find(asset => asset.name.endsWith('.js'))!.name
    expect(appFile).toMatch(app)
    expect(runtimeFile).not.toBe(appFile)
    expect(readFileSync(join(root, 'dist', appFile), 'utf8')).toContain('__APP_FILENAME_PROBE__')
    expect(readFileSync(join(root, 'dist', runtimeFile), 'utf8')).not.toContain('__APP_FILENAME_PROBE__')
    if (typeof filename === 'string' && filename.includes('[name]')) expect(runtimeFile).toBe('js/master-css-runtime.js')
    if (typeof filename === 'string' && filename.includes('[contenthash')) expect(runtimeFile).toMatch(/^js\/[a-f0-9]{8}\.js$/)
  } finally { rmSync(root, { recursive: true, force: true }) }
}, 120000)
