import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import type { MasterCSSVitePluginContext } from '../../src/core'
import { clearDevStylesheets, devStylesheetState, getDevStylesheetDelivery, publishDevStylesheets } from '../../src/utils/dev-stylesheet-delivery'

test.each(['replace', 'delete'] as const)('resource naming captures bytes before source %s', action => {
  const root = mkdtempSync(join(tmpdir(), 'dev-resource-snapshot-')), source = join(root, 'pixel.svg')
  const context = { config: { command: 'serve', base: '/base/' } } as MasterCSSVitePluginContext
  const red = '<svg xmlns="http://www.w3.org/2000/svg"><title>red</title></svg>'
  let snapshot: string | undefined
  try {
    writeFileSync(source, red)
    const delivery = getDevStylesheetDelivery(context)!
    const href = delivery.resourceURL(source)
    if (action === 'replace') writeFileSync(source, '<svg xmlns="http://www.w3.org/2000/svg"><title>blue</title></svg>')
    else rmSync(source)
    publishDevStylesheets(context, {
      css: `.resource{background-image:url("${href}")}`,
      resources: [{ file: source, href }],
      diagnostics: [], emittedGlobals: { variables: {}, animations: {} }
    }, '#master-css-slot{--slot:0}')
    snapshot = devStylesheetState(context).resources.get(new URL(href).pathname)?.file
    expect(snapshot).toBeDefined()
    expect(readFileSync(snapshot!, 'utf8')).toBe(red)
  } finally {
    clearDevStylesheets(context)
    rmSync(root, { recursive: true, force: true })
    if (snapshot) expect(existsSync(snapshot)).toBe(false)
  }
})
