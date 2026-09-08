import { parse } from 'svelte/compiler'
import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { extractSvelteClasses } from '../../src/source/adapters/svelte'
import { MasterCSSScanner } from '../../src/scanner'

const cases = [
  {
    name: 'if, else-if and else',
    markup: '{#if enabled}<div class="block"/>{:else if other}<div class="hidden"/>{:else}<div class="flex"/>{/if}',
    classes: ['block', 'hidden', 'flex']
  },
  {
    name: 'each body and empty fallback',
    markup: '{#each items as item}<div class="grid"/>{:else}<div class="inline"/>{/each}',
    classes: ['grid', 'inline']
  },
  {
    name: 'await pending, resolved and rejected',
    markup: '{#await promise}<div class="block"/>{:then value}<div class="flex"/>{:catch error}<div class="hidden"/>{/await}',
    classes: ['block', 'flex', 'hidden']
  },
  {
    name: 'await shorthand then',
    markup: '{#await promise then value}<div class="block"/>{:catch error}<div class="hidden"/>{/await}',
    classes: ['block', 'hidden']
  },
  {
    name: 'await shorthand catch',
    markup: '{#await promise catch error}<div class="flex"/>{/await}',
    classes: ['flex']
  },
  {
    name: 'nested alternate blocks and class directives',
    markup: '{#if enabled}<div class="block"/>{:else}{#each items as item}<div class="hidden"/>{:else}{#await promise}<div class="grid"/>{:then value}<div class="inline"/>{:catch error}<div class:flex={enabled}/>{/await}{/each}{/if}',
    classes: ['block', 'hidden', 'grid', 'inline', 'flex']
  },
  {
    name: 'snippet body nested in alternate',
    markup: '{#if enabled}<div class="block"/>{:else}{#snippet fallback()}<div class="hidden"/>{/snippet}{@render fallback()}{/if}',
    classes: ['block', 'hidden']
  }
]

for (const { name, markup, classes } of cases) {
  test(`BH-0011 extracts ${name} without falling back to arbitrary source text`, async () => {
    const content = `<div data-ignore="not-a-class"/>${markup}`
    expect(() => parse(content)).not.toThrow()
    expect(await extractSvelteClasses('App.svelte', content)).toEqual(classes)
  })
}

test('BH-0011 scanner emits classes from nested Svelte alternatives', async () => {
  const scanner = await new MasterCSSScanner({ manifest: defaultManifest as unknown as MasterCSSManifest, verbose: 0 }).init()
  try {
    await scanner.scanModule('App.svelte', cases[5].markup)
    for (const value of ['block', 'hidden', 'grid', 'inline', 'flex']) {
      expect(scanner.validClasses.has(value)).toBe(true)
    }
    for (const declaration of ['display:block', 'display:none', 'display:grid', 'display:inline', 'display:flex']) {
      expect(scanner.css.text).toContain(declaration)
    }
  } finally {
    await scanner.dispose()
  }
})
