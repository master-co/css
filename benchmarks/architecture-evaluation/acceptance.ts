import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { arch, cpus, platform } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from '@playwright/test'
import type { Arm, TaskId } from './fixtures'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export const resultRoot = resolve(repoRoot, 'benchmarks/.results/architecture-evaluation')
const require = createRequire(import.meta.url)
export const masterCLI = resolve(repoRoot, 'packages/cli/dist/bin/index.js')
export const mcpCLI = resolve(repoRoot, 'packages/mcp/dist/bin/index.js')
export const tailwindCLI = resolve(dirname(require.resolve('@tailwindcss/cli/package.json')), 'dist/index.mjs')

export const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
export function sourceHashes(workspace: string, allowUnavailable = false) {
  return Object.fromEntries(['index.html', 'input.css', 'app.js'].map(file => {
    try { return [file, digest(readFileSync(resolve(workspace, file)))] }
    catch (error) {
      // Failed trials still need a record when an input was deleted or became unreadable.
      if (allowUnavailable) return [file, null]
      throw error
    }
  }))
}
function treeHash(folder: string): string | null {
  if (!existsSync(folder)) return null
  const hash = createHash('sha256')
  const visit = (path: string) => {
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = resolve(path, entry.name)
      if (entry.isDirectory()) visit(file)
      else if (entry.isFile()) hash.update(file.slice(folder.length)).update('\0').update(readFileSync(file)).update('\0')
    }
  }
  visit(folder)
  return hash.digest('hex')
}
export function environment() {
  const packages = ['compiler', 'css', 'binding', 'binding-wasm-compiler', 'binding-wasm-engine', 'binding-wasm-tooling', 'schema', 'preset', 'cli', 'mcp', 'tooling', 'language-service']
  return {
    platform: platform(), arch: arch(), cpu: cpus()[0]?.model, node: process.version,
    bun: process.versions.bun ?? null,
    revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim(),
    tailwind: JSON.parse(readFileSync(require.resolve('tailwindcss/package.json'), 'utf8')).version,
    artifacts: Object.fromEntries([masterCLI, mcpCLI, require.resolve('@master/css-compiler/node'), require.resolve('@master/css/node')]
      .map(file => [file.replace(repoRoot + '/', ''), digest(readFileSync(file))])),
    trees: Object.fromEntries(['benchmarks/architecture-evaluation', ...packages.flatMap(name => ['src', 'dist', 'artifacts'].map(kind => `packages/${name}/${kind}`))]
      .map(path => [path, treeHash(resolve(repoRoot, path))]))
  }
}

export function build(workspace: string, arm: Arm) {
  if (arm === 'native-css') {
    writeFileSync(resolve(workspace, 'output.css'), readFileSync(resolve(workspace, 'input.css')))
    return
  }
  const args = arm === 'tailwind'
    ? [tailwindCLI, '-i', 'input.css', '-o', 'output.css']
    : [masterCLI, 'generate', 'index.html', 'app.js', '-o', 'output.css', '-v', '0', '--strict']
  execFileSync(process.execPath, args, { cwd: workspace, timeout: 120_000, stdio: 'pipe' })
}

export async function check(workspace: string, arm: Arm, task: TaskId, browser?: Browser) {
  build(workspace, arm)
  const owned = !browser
  browser ??= await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const checks: { id: string, actual: unknown, expected: unknown, pass: boolean }[] = []
  const eq = (id: string, actual: unknown, expected: unknown) => checks.push({ id, actual, expected, pass: JSON.stringify(actual) === JSON.stringify(expected) })
  const style = (selector: string, property: string) => page.locator(selector).evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)
  const columns = async (selector: string) => (await style(selector, 'grid-template-columns')).split(' ').length
  try {
    await page.goto(pathToFileURL(resolve(workspace, 'index.html')).href)
    eq('neutral-control', await style('[data-neutral]', 'background-color'), 'rgb(229, 231, 235)')
    eq('information-token-control', await style('[data-information]', 'background-color'), 'rgb(37, 99, 235)')
    eq('information-token-available', Boolean((await style('[data-information]', '--color-information')).trim()), true)
    eq('control-grid', await columns('#control-grid'), 3)
    eq('secondary-rest', await style('#secondary', 'background-color'), 'rgb(37, 99, 235)')
    await page.locator('#secondary').hover()
    eq('secondary-hover', await style('#secondary', 'background-color'), 'rgb(37, 99, 235)')
    await page.mouse.move(0, 0)
    const expectedBrand = task === 'token-migration' ? 'rgb(124, 58, 237)' : 'rgb(37, 99, 235)'
    for (let i = 0; i < 2; i++) eq(`brand-${i}`, await style(`[data-brand]:nth-child(${i + 1})`, 'background-color'), expectedBrand)
    if (task === 'token-migration') {
      eq('old-token-removed', /--color-brand\b/.test(['input.css', 'index.html', 'app.js'].map(file => readFileSync(resolve(workspace, file), 'utf8')).join('\n')), false)
    }
    for (const width of [375, 767, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 })
      eq(`cards-${width}`, await columns('#cards'), task === 'responsive-layout' ? width >= 768 ? 2 : 1 : width >= 1024 ? 3 : 1)
      eq(`control-grid-${width}`, await columns('#control-grid'), 3)
    }
    eq('danger-rest', await style('#danger', 'background-color'), 'rgb(37, 99, 235)')
    await page.locator('#danger').hover()
    eq('danger-hover', await style('#danger', 'background-color'), task === 'scoped-hover' ? 'rgb(220, 38, 38)' : 'rgb(37, 99, 235)')
    await page.mouse.move(0, 0)
    for (const value of [-20, 0, 63.5, 120]) {
      await page.evaluate(value => (window as unknown as { setProgress(value: number): void }).setProgress(value), value)
      const actual = parseFloat(await style('#fill', 'width'))
      const expected = task === 'dynamic-value' ? Math.max(0, Math.min(100, value)) * 2 : 80
      eq(`progress-${value}`, Math.abs(actual - expected) < .1, true)
    }
    for (const tone of ['warning', 'neutral']) {
      await page.evaluate(tone => (window as unknown as { setTone(tone: string): void }).setTone(tone), tone)
      const warning = task === 'source-discovery' && tone === 'warning'
      eq(`${tone}-background`, await style('#badge', 'background-color'), warning ? 'rgb(254, 243, 199)' : 'rgb(229, 231, 235)')
      eq(`${tone}-color`, await style('#badge', 'color'), warning ? 'rgb(120, 53, 15)' : 'rgb(17, 24, 39)')
    }
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      await page.emulateMedia({ reducedMotion })
      eq(`pulse-${reducedMotion}`, await style('#pulse', 'animation-name'), task === 'reduced-motion' && reducedMotion === 'reduce' ? 'none' : 'pulse')
      eq(`spin-${reducedMotion}`, await style('#spin', 'animation-name'), 'spin')
    }
    eq('page-errors', errors, [])
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.screenshot({ path: resolve(workspace, 'review.png'), fullPage: true, animations: 'disabled' })
    const report = { version: 1, arm, task, passed: checks.every(row => row.pass), checks, sourceHashes: sourceHashes(workspace), cssSHA256: digest(readFileSync(resolve(workspace, 'output.css'))), browser: browser.version() }
    writeFileSync(resolve(workspace, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n')
    return report
  } finally {
    await page.close()
    if (owned) await browser.close()
  }
}
