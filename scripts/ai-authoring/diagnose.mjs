import { parseArgs } from 'node:util'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { access, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import { loadProjectManifest } from '@master/css-compiler/project'
import { compareStyleEvidence, inspectPageClasses, applyDiagnosticState } from './browser-diagnostics.mjs'

const { values } = parseArgs({ options: {
  source: { type: 'string' }, target: { type: 'string' }, selector: { type: 'string' },
  properties: { type: 'string', default: 'line-height,height,color,background-color,padding-top' },
  root: { type: 'string' }, entry: { type: 'string', default: 'app.css' },
  width: { type: 'string', default: '390' }, scheme: { type: 'string', default: 'light' },
  state: { type: 'string', default: 'rest' }, output: { type: 'string' }, help: { type: 'boolean' }
} })
if (values.help) {
  console.log('Usage: node --import tsx scripts/ai-authoring/diagnose.mjs --source SOURCE.html --target TARGET.html --selector CSS_SELECTOR [--properties line-height,height] [--root PROJECT] [--entry app.css] [--width 390] [--scheme light|dark] [--state rest|hover|focus|disabled] [--output report.json]\nBuild both pages first. This repository tool reads local pages using the installed Chromium; it does not build, migrate or modify source files. Output contains computed values, matching rule candidates, ancestor values and unresolved classes, not a proven cascade winner.')
} else {
  if (!values.source || !values.target || !values.selector) throw new Error('--source, --target and --selector are required; use --help')
  const width = Number(values.width)
  if (!Number.isInteger(width) || width < 1 || width > 10000) throw new Error('--width must be an integer from 1 to 10000')
  if (!['light', 'dark'].includes(values.scheme)) throw new Error('--scheme must be light or dark')
  if (!['rest', 'hover', 'focus', 'disabled'].includes(values.state)) throw new Error('Unsupported --state')
  const properties = [...new Set(values.properties.split(',').map(name => name.trim()).filter(Boolean))]
  if (!properties.length || properties.length > 32) throw new Error('Request between 1 and 32 CSS properties')
  const source = resolve(values.source), target = resolve(values.target)
  await Promise.all([access(source), access(target)])
  const root = resolve(values.root ?? dirname(target))
  const browser = await chromium.launch()
  try {
    const report = { version: 1, browser: browser.version(), ...await compareStyleEvidence(browser, {
      source: pathToFileURL(source).href, target: pathToFileURL(target).href,
      selector: values.selector, properties, width, colorScheme: values.scheme, state: values.state
    }) }
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: values.scheme })
    try {
      const manifest = await loadProjectManifest({ root, entries: [resolve(root, values.entry)], baseManifest: { version: 6, languageVersion: 18 } })
      const page = await context.newPage()
      page.setDefaultTimeout(2000)
      await page.goto(pathToFileURL(target).href)
      await applyDiagnosticState(page, values.state, values.selector)
      report.classes = await inspectPageClasses(page, manifest)
    } catch (error) { report.classes = { status: 'unavailable', error: error.message } }
    finally { await context.close() }
    const json = JSON.stringify(report, null, 2) + '\n'
    if (values.output) {
      const output = resolve(values.output)
      // Exclusive creation protects pages, stylesheets and previous evidence.
      await writeFile(output, json, { flag: 'wx' })
      console.log(output)
    } else process.stdout.write(json)
    if (report.source.status !== 'captured' || report.target.status !== 'captured' || report.classes.status === 'unavailable') process.exitCode = 1
  } finally { await browser.close() }
}
