import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'
import { initToolingWasm } from '../src'

test('loads the isolated source tooling Wasm surface', async () => {
  const input = new Uint8Array(await readFile(new URL(
    '../artifacts/mastercss_wasm_tooling_bg.wasm',
    import.meta.url
  )))
  const tooling = await initToolingWasm({ input })
  expect(tooling.extractOxcClasses(
    'component.tsx',
    'const classes = "block mx:auto"; import value from "ignored"'
  )).toEqual(['block', 'mx:auto'])
  expect(tooling.extractHTMLClasses(
    'index.html',
    '<main class="grid"><script>const classes = "fg:red"</script></main>'
  )).toEqual(['grid', 'fg:red'])

  const scanner = new tooling.ToolingScannerSession(JSON.stringify({
    version: 1,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: 0,
      emit: {
        type: 'static',
        rules: [{ declarations: { display: 'block' } }]
      },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))
  expect(scanner.scan('component.tsx', 'const classes = "block unknown"')).toMatchObject({
    changed: true,
    validClasses: ['block'],
    invalidClasses: ['unknown']
  })
  expect(scanner.state()).toMatchObject({
    latentClasses: ['block', 'unknown'],
    cachedSources: 1
  })
  scanner.dispose()
  scanner.free()

  const validator = new tooling.ToolingValidatorSession(JSON.stringify({
    version: 1,
    utilities: [{
      id: 'display-block',
      name: 'block',
      type: 0,
      emit: {
        type: 'static',
        rules: [{ declarations: { display: 'block' } }]
      },
      matchers: [{ type: 'static', name: 'block' }]
    }]
  }))
  expect(validator.generateClasses(['block', 'unknown'])).toMatchObject({
    version: 1,
    classes: [
      { className: 'block', matched: true, rules: [{ text: '.block{display:block}' }] },
      { className: 'unknown', matched: false, rules: [] }
    ]
  })
  validator.dispose()
  validator.free()
})
