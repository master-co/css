import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { createPresetEngine } from './preset-css'
import { generatePresetCSS } from './generate-preset-css'

test('reused examples match fresh engines without retaining rules or resources', () => {
  const cases = [
    ['bg-blue-60', 'block', 'block'],
    ['animation:fade|1s'],
    ['fg-red:hover', 'unknown'],
    [],
    ['block'],
    ['bg-blue-60']
  ]
  for (const classes of cases) {
    const engine = createPresetEngine()
    try {
      engine.ensureClassRules(classes)
      assert.equal(generatePresetCSS(classes), engine.snapshot().text)
    } finally {
      engine.dispose()
    }
  }
})
