import { describe, expect, test } from 'vitest'
import { MasterCSSScanner } from './test-scanner'

const CSSScanner = MasterCSSScanner

describe('scanner source adapters', () => {
  test('does not restore the removed custom source adapter registry', async () => {
    const adapter = {
      name: 'test',
      test: /\.txt$/,
      extract: async () => ['block']
    }
    const scanner = await new CSSScanner({
      // @ts-expect-error rc.87 exposed custom adapters; the Rust scanner intentionally does not.
      adapters: [adapter]
    }).init()

    await expect(scanner.collectCandidates('fixture.txt', 'hidden'))
      .resolves
      .toEqual(['hidden'])
  })

  test('uses built-in source adapters from @master/css-source by default', async () => {
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

  test('uses the built-in source extraction pipeline by default', async () => {
    const scanner = await new MasterCSSScanner({}).init()

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
    const scanner = await new MasterCSSScanner({}).init()

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
