import { afterEach, describe, expect, test, vi } from 'vitest'
import { extractAstroClassesNative as extractAstroClasses, extractClassCandidatesNative as extractClassCandidates, extractHTMLClassesNative as extractHTMLClasses } from '../../src/source/native'
import { extractOxcClasses } from '../../src/source/adapters/oxc'
import { extractSvelteClasses } from '../../src/source/adapters/svelte'
import { extractVueClasses } from '../../src/source/adapters/vue'
import { matchesSourceAdapter, type SourceAdapter } from '../../src/source/adapters/types'
import {
  resetOptionalPeerStateForTest,
  setOptionalPeerImporterForTest
} from '../../src/source/adapters/optional-peer'

afterEach(() => {
  resetOptionalPeerStateForTest()
  vi.restoreAllMocks()
})

describe('source adapters', () => {
  test('exports class candidate extraction', () => {
    expect(extractClassCandidates("<div class=\"display:block margin-inline:auto\"></div>")).toEqual(["display:block", "margin-inline:auto"])
  })

  test('ignores module specifiers, require calls, dynamic imports, and common directives with Oxc', () => {
    expect(extractOxcClasses('component.tsx', `
      'use client'
      import React from 'react'
      export { helper } from 'pkg'
      await import('lazy-module')
      const fs = require('fs')
      const classes = 'display:block fg-red'
    `)).toEqual([
      "display:block",
      'fg-red'
    ])
  })

  test('extracts class attributes and script strings from HTML', () => {
    expect(extractHTMLClasses('index.html', "\n      <div class=\"display:block margin-inline:auto\"></div>\n      <script>\n        element.classList.add('fg-red', 'padding:1rem')\n        const classes = 'display:flex display:none'\n      </script>\n    ")).toEqual([
      "display:block",
      "margin-inline:auto",
      'fg-red',
      "padding:1rem",
      "display:flex",
      "display:none"
    ])
  })

  test('does not load optional framework parsers for barrel-only helpers', () => {
    const importer = vi.fn(async () => ({}))
    setOptionalPeerImporterForTest(importer)

    expect(extractClassCandidates("<div class=\"display:block\"></div>")).toEqual(["display:block"])
    expect(importer).not.toHaveBeenCalled()
  })

  test('extracts template, script, and script setup classes from Vue SFCs', async () => {
    await expect(extractVueClasses('App.vue', "\n      <template>\n        <button class=\"display:block margin-inline:auto\">Save</button>\n      </template>\n      <script>\n        const rootClasses = 'fg-red'\n      </script>\n      <script setup lang=\"ts\">\n        const setupClasses = 'padding:1rem'\n      </script>\n    ")).resolves.toEqual([
      "display:block",
      "margin-inline:auto",
      'fg-red',
      "padding:1rem"
    ])
  })

  test('extracts markup, module script, instance script, and class directive classes from Svelte files', async () => {
    await expect(extractSvelteClasses('Component.svelte', "\n      <script context=\"module\">\n        const moduleClasses = 'fg-red'\n      </script>\n      <script>\n        const instanceClasses = 'padding:1rem'\n        let enabled = true\n      </script>\n      <button class=\"display:block margin-inline:auto\" class:active={enabled}>Save</button>\n    ")).resolves.toEqual([
      'fg-red',
      "padding:1rem",
      "display:block",
      "margin-inline:auto",
      'active'
    ])
  })

  test('parses TypeScript in Svelte scripts and class expressions without treating it as JavaScript', async () => {
    await expect(extractSvelteClasses('Typed.svelte', "\n      <script context=\"module\" lang=\"ts\">\n        import type { Component } from 'svelte'\n        const moduleClasses: string = 'fg-red'\n      </script>\n      <script lang='ts'>\n        const enabled: boolean = true\n        const instanceClasses: string = 'padding:1rem'\n      </script>\n      <button class={enabled ? 'display:block' : ('display:none' satisfies string)} class:active={enabled}>Save</button>\n    ")).resolves.toEqual(['fg-red', "padding:1rem", "display:block", "display:none", 'active'])
  })

  test('extracts frontmatter, script, and markup classes from Astro files while ignoring styles', () => {
    expect(extractAstroClasses('Page.astro', "---\nconst frontmatterClasses = 'fg-red'\n---\n<script>\n  const scriptClasses = 'padding:1rem'\n</script>\n<style>\n  .ignored { color: red; }\n</style>\n<main class=\"display:block margin-inline:auto\">Hello</main>\n    ")).toEqual([
      'fg-red',
      "padding:1rem",
      "display:block",
      "margin-inline:auto"
    ])
  })

  test('reports missing framework parsers without raw fallback', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setOptionalPeerImporterForTest(async () => {
      throw new Error('missing peer')
    })

    await expect(extractVueClasses('App.vue', "<template><div class=\"display:block\"></div></template>"))
      .rejects.toMatchObject({ code: 'SOURCE_PARSE_ERROR' })
    await expect(extractVueClasses('Other.vue', '<template><div class="fg-red"></div></template>'))
      .rejects.toMatchObject({ code: 'SOURCE_PARSE_ERROR' })
    await expect(extractSvelteClasses('Component.svelte', "<div class=\"padding:1rem\"></div>"))
      .rejects.toMatchObject({ code: 'SOURCE_PARSE_ERROR' })
    await expect(extractSvelteClasses('Other.svelte', "<div class=\"margin-inline:auto\"></div>"))
      .rejects.toMatchObject({ code: 'SOURCE_PARSE_ERROR' })

    expect(warn).toHaveBeenCalledTimes(2)
    expect(warn.mock.calls[0]?.[0]).toContain('Optional Vue SFC parser "vue/compiler-sfc" could not be loaded')
    expect(warn.mock.calls[1]?.[0]).toContain('Optional Svelte parser "svelte/compiler" could not be loaded')
  })

  test('matches adapters with global regular expressions consistently', () => {
    const adapter: SourceAdapter = {
      name: 'global-regexp',
      test: /\.txt$/g,
      extract: async () => []
    }

    expect(matchesSourceAdapter(adapter, 'a.txt')).toBe(true)
    expect(matchesSourceAdapter(adapter, 'b.txt')).toBe(true)
  })
})
