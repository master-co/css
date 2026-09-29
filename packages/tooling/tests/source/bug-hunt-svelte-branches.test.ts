import { parse } from 'svelte/compiler'
import { expect, test } from 'vitest'
import defaultManifest from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { extractSvelteClasses } from '../../src/source/adapters/svelte'
import { MasterCSSScanner } from '../../src/scanner'

const cases = [
  {
    name: 'if, else-if and else',
    markup: '{#if enabled}<div class="display:block"/>{:else if other}<div class="display:none"/>{:else}<div class="display:flex"/>{/if}',
    classes: ["display:block", "display:none", "display:flex"]
  },
  {
    name: 'each body and empty fallback',
    markup: '{#each items as item}<div class="display:grid"/>{:else}<div class="display:inline"/>{/each}',
    classes: ["display:grid", "display:inline"]
  },
  {
    name: 'await pending, resolved and rejected',
    markup: '{#await promise}<div class="display:block"/>{:then value}<div class="display:flex"/>{:catch error}<div class="display:none"/>{/await}',
    classes: ["display:block", "display:flex", "display:none"]
  },
  {
    name: 'await shorthand then',
    markup: '{#await promise then value}<div class="display:block"/>{:catch error}<div class="display:none"/>{/await}',
    classes: ["display:block", "display:none"]
  },
  {
    name: 'await shorthand catch',
    markup: '{#await promise catch error}<div class="display:flex"/>{/await}',
    classes: ["display:flex"]
  },
  {
    name: 'nested alternate blocks and class directives',
    markup: '{#if enabled}<div class="display:block"/>{:else}{#each items as item}<div class="display:none"/>{:else}{#await promise}<div class="display:grid"/>{:then value}<div class="display:inline"/>{:catch error}<div class:active={enabled}/>{/await}{/each}{/if}',
    classes: ["display:block", "display:none", "display:grid", "display:inline", "active"]
  },
  {
    name: 'snippet body nested in alternate',
    markup: '{#if enabled}<div class="display:block"/>{:else}{#snippet fallback()}<div class="display:none"/>{/snippet}{@render fallback()}{/if}',
    classes: ["display:block", "display:none"]
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
    for (const value of ["display:block", "display:none", "display:grid", "display:inline"]) {
      expect(scanner.validClasses.has(value)).toBe(true)
    }
    for (const declaration of ['display:block', 'display:none', 'display:grid', 'display:inline']) {
      expect(scanner.css.text).toContain(declaration)
    }
  } finally {
    await scanner.dispose()
  }
})
