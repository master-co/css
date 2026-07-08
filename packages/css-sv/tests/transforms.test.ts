import { describe, expect, test } from 'vitest'
import {
  addMasterCSSServerHook,
  addMasterCSSStylesheetImport,
  addMasterCSSVitePlugin,
  addStylesheetImportToLayout
} from '../src/transforms'

describe('@master/css-sv transforms', () => {
  test('adds the Master CSS Svelte Vite plugin idempotently', () => {
    const input = `
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()]
})
`
    const once = addMasterCSSVitePlugin(input)
    const twice = addMasterCSSVitePlugin(once)

    expect(twice).toBe(once)
    expect(once).toContain(`import masterCSS from '@master/css.svelte/vite';`)
    expect(once).toContain('plugins: [sveltekit(), masterCSS()]')
  })

  test('adds the Master CSS stylesheet import idempotently', () => {
    const once = addMasterCSSStylesheetImport('body { margin: 0; }')
    const twice = addMasterCSSStylesheetImport(once)

    expect(twice).toBe(once)
    expect(once).toContain("@import '@master/css';")
    expect(once).toContain('body {')
  })

  test('imports the stylesheet from an empty SvelteKit layout and preserves child rendering', () => {
    const output = addStylesheetImportToLayout('', 'ts', './layout.css', '5.56.3')

    expect(output).toContain(`<script lang="ts">`)
    expect(output).toContain(`import './layout.css';`)
    expect(output).toMatch(/children|<slot/)
  })

  test('creates a server hook when none exists', () => {
    const output = addMasterCSSServerHook('', 'ts')

    expect(output).toContain(`import masterCSSSvelteHandle from '@master/css.svelte/hooks.server';`)
    expect(output).toContain(`import type { Handle } from '@sveltejs/kit';`)
    expect(output).toContain('const masterCSSHandle: Handle = masterCSSSvelteHandle;')
    expect(output).toContain('export const handle')
  })

  test('composes an existing server handle with Master CSS first', () => {
    const input = `
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('before', 'after')
  })
}
`
    const output = addMasterCSSServerHook(input, 'ts')

    expect(output).toContain(`import { sequence } from '@sveltejs/kit/hooks';`)
    expect(output).toContain('sequence(masterCSSHandle, originalHandle)')
  })

  test('prepends Master CSS to an existing sequence idempotently', () => {
    const input = `
import { sequence } from '@sveltejs/kit/hooks'
import type { Handle } from '@sveltejs/kit'

const first: Handle = async ({ event, resolve }) => resolve(event)
const second: Handle = async ({ event, resolve }) => resolve(event)
export const handle = sequence(first, second)
`
    const once = addMasterCSSServerHook(input, 'ts')
    const twice = addMasterCSSServerHook(once, 'ts')

    expect(twice).toBe(once)
    expect(once).toContain('sequence(masterCSSHandle, first, second)')
    expect(once.match(/masterCSSHandle/g)?.length).toBeGreaterThan(1)
  })
})
