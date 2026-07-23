import { describe, expect, test } from 'vitest'
import CSSScanner from '../../src/scanner'

describe('scanner source adapters', () => {
  test('uses the built-in source extraction pipeline by default', async () => {
    const scanner = await new CSSScanner({}).init()

    await expect(scanner.collectCandidates('index.html', `
      <div class="block mx:auto"></div>
      <script>const classes = 'fg:red'</script>
    `)).resolves.toEqual(['block', 'mx:auto', 'fg:red'])

    await expect(scanner.collectCandidates('component.tsx', `
      const classes = 'inline-flex'
      export function App() {
        return <div className="hidden" />
      }
    `)).resolves.toEqual(['inline-flex', 'hidden'])
  })

  test('auto extracts framework source files by extension', async () => {
    const scanner = await new CSSScanner({}).init()

    await expect(scanner.collectCandidates('component.vue', `
      <template><div class="block"></div></template>
      <script setup>const classes = 'fg:red'</script>
    `)).resolves.toEqual(['block', 'fg:red'])

    await expect(scanner.collectCandidates('component.svelte', `
      <script>const classes = 'p:4x'</script>
      <div class="mx:auto"></div>
    `)).resolves.toEqual(['p:4x', 'mx:auto'])

    await expect(scanner.collectCandidates('page.astro', `---
const classes = 'inline-flex'
---
<div class="hidden"></div>
    `)).resolves.toEqual(['inline-flex', 'hidden'])
  })
})
