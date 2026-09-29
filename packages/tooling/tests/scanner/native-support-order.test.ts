import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSSScanner } from '../../src/scanner'

const wasm = { input: readFileSync(new URL('../../../binding-wasm-tooling/artifacts/mastercss_binding_wasm_tooling_bg.wasm', import.meta.url)) }

test.each(['native', 'wasm'] as const)('%s scanner keeps native validation aligned across files', async (binding) => {
  const sources = [
    '<div class="made-up:bad"></div>',
    '<div class="blocked:value made-up:bad accent-color:red accent-color:blue caret-color:red"></div>'
  ]
  let expectedCSS: string | undefined
  for (const order of [[0, 1], [1, 0]]) {
    const scanner = await new MasterCSSScanner({
      manifest: defaultManifest as unknown as MasterCSSManifest,
      binding,
      wasm,
      blocklist: ['blocked:value'],
      verbose: 0
    }).init()
    try {
      for (const index of order) await scanner.scan(`${index}.html`, sources[index])
      expect([...scanner.validClasses].sort()).toEqual([
        'accent-color:blue',
        'accent-color:red',
        'caret-color:red',
        'made-up:bad'
      ])
      expect([...scanner.invalidClasses]).toEqual([])
      expectedCSS ??= scanner.css.text
      expect(scanner.css.text).toBe(expectedCSS)
      await scanner.scan('repeat.html', sources[1])
      expect(scanner.css.text).toBe(expectedCSS)
    } finally {
      await scanner.dispose()
    }
  }
})

test.each(['native', 'wasm'] as const)('%s scanner rejects complete retired tokens across source syntaxes', async (binding) => {
  const scanner = await new MasterCSSScanner({ manifest: defaultManifest as unknown as MasterCSSManifest, binding, wasm, verbose: 0 }).init()
  const classes = '{p-md;animation:float|1s} color:red:of(.active) padding:11px'
  try {
    for (const [file, source] of [
      ['index.html', `😀<div class="${classes}"/>`],
      ['index.tsx', `const view = <div className="${classes}"/>`],
      ['index.vue', `<template><div class="${classes}"/></template>`],
      ['index.svelte', `<div class={'${classes}'}/>`],
      ['index.mdx', `<div className="${classes}"/>`]
    ]) await scanner.scan(file, source)
    expect([...scanner.validClasses]).toEqual(['padding:11px'])
    expect(scanner.css.text).toBe('@layer utilities{.padding\\:11px{padding:11px}}')
    expect(scanner.css.text).not.toContain('--spacing-md')
    expect(scanner.css.text).not.toContain('@keyframes')
  } finally {
    await scanner.dispose()
  }
})
