import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deliveryEnd, deliveryRenderedClasses, deliveryRuleAt, deliveryTiming } from './delivery-content'
import { getDeliveryProgram } from './delivery-program'

test('delivery preview keeps engine-generated token globals when rules are independently applied', () => {
  const program = getDeliveryProgram()
  assert.equal(program.rules.length, deliveryRenderedClasses.length)
  assert.ok(program.globals.includes(':host'))
  for (const rule of program.rules) {
    assert.ok(rule.text.startsWith(rule.selector + '{'))
    assert.ok(!program.globals.includes(rule.text), rule.className)
  }
  assert.equal(program.rules.find(rule => rule.className === 'p-lg')?.text, '.p-lg{padding:var(--spacing-lg)}')
})

test('no rule reaches the preview before First paint, and every mode paints before the timeline ends', () => {
  const firstPaint = deliveryEnd - 1
  for (const mode of ['static', 'prerender', 'runtime'] as const) {
    const timing = deliveryTiming[mode]
    const lastRule = Math.max(...deliveryRenderedClasses.map(className => deliveryRuleAt(mode, className)))
    const firstApplied = mode === 'runtime' ? Math.min(...deliveryRenderedClasses.map(className => deliveryRuleAt(mode, className))) : timing.sheet
    assert.ok(firstApplied > firstPaint, mode)
    assert.ok(timing.paint < deliveryEnd, mode)
    assert.ok(lastRule <= timing.paint, mode)
  }
  // Prerendered rules are written into the page before a runtime would have started.
  const lastPrerendered = Math.max(...deliveryRenderedClasses.map(className => deliveryRuleAt('prerender', className)))
  assert.ok(lastPrerendered < deliveryTiming.runtime.rules)
  assert.ok(deliveryTiming.runtime.reference < deliveryTiming.runtime.rules)
})
