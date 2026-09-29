import { describe, expect, test } from 'vitest'
import { MasterCSSScanner } from './test-scanner'

const CSSScanner = MasterCSSScanner

describe('scanner source adapters', () => {
  test('does not restore the removed custom source adapter registry', async () => {
    const adapter = {
      name: 'test',
      test: /\.txt$/,
      extract: async () => ["display:block"]
    }
    const scanner = await new CSSScanner({
      // @ts-expect-error rc.87 exposed custom adapters; the Rust scanner intentionally does not.
      adapters: [adapter]
    }).init()

    await expect(scanner.collectCandidates('fixture.txt', "display:none"))
      .resolves
      .toEqual(["display:none"])
  })

  test('uses built-in source adapters from @master/css-source by default', async () => {
    const scanner = await new CSSScanner({}).init()

    await expect(scanner.collectCandidates('index.html', "\n      <div class=\"display:block margin-inline:auto\"></div>\n      <script>const classes = 'fg-red'</script>\n    ")).resolves.toEqual(["display:block", "margin-inline:auto", 'fg-red'])

    await expect(scanner.collectCandidates('component.tsx', "\n      const classes = 'display:inline-flex'\n      export function App() {\n        return <div className=\"display:none\" />\n      }\n    ")).resolves.toEqual(["display:inline-flex", "display:none"])
  })

  test('uses the built-in source extraction pipeline by default', async () => {
    const scanner = await new MasterCSSScanner({}).init()

    await expect(scanner.collectCandidates('index.html', "\n      <div class=\"display:block margin-inline:auto\"></div>\n      <script>const classes = 'fg-red'</script>\n    ")).resolves.toEqual(["display:block", "margin-inline:auto", 'fg-red'])

    await expect(scanner.collectCandidates('component.tsx', "\n      const classes = 'display:inline-flex'\n      export function App() {\n        return <div className=\"display:none\" />\n      }\n    ")).resolves.toEqual(["display:inline-flex", "display:none"])
  })

  test('auto extracts framework source files by extension', async () => {
    const scanner = await new MasterCSSScanner({}).init()

    await expect(scanner.collectCandidates('component.vue', "\n      <template><div class=\"display:block\"></div></template>\n      <script setup>const classes = 'fg-red'</script>\n    ")).resolves.toEqual(["display:block", 'fg-red'])

    await expect(scanner.collectCandidates('component.svelte', "\n      <script>const classes = 'padding:1rem'</script>\n      <div class=\"margin-inline:auto\"></div>\n    ")).resolves.toEqual(["padding:1rem", "margin-inline:auto"])

    await expect(scanner.collectCandidates('page.astro', "---\nconst classes = 'display:inline-flex'\n---\n<div class=\"display:none\"></div>\n    ")).resolves.toEqual(["display:inline-flex", "display:none"])
  })
})
