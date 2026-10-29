import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deliveryAdded, deliveryLateClass, deliveryRenderedClasses, deliveryRuleAt, deliveryTiming } from './delivery-content'
import { getDeliveryProgram } from './delivery-program'

test('delivery preview keeps engine-generated token globals when rules are independently applied', () => {
  const program = getDeliveryProgram()
  assert.equal(program.rules.length, deliveryRenderedClasses.length + 1)
  assert.ok(program.globals.includes(':host'))
  assert.ok(program.globals.includes('--color-amber-10:'))
  for (const rule of program.rules) {
    assert.ok(rule.text.startsWith(rule.selector + '{'))
    assert.ok(!program.globals.includes(rule.text), rule.className)
  }
  assert.equal(program.rules.find(rule => rule.className === deliveryLateClass)?.text, '.bg-amber-10{background-color:var(--color-amber-10)}')
})

test('the delivery story distinguishes pre-generated CSS from an uncovered browser class', () => {
  assert.ok(deliveryRuleAt('static', deliveryLateClass) < deliveryAdded)
  for (const mode of ['progressive', 'runtime'] as const) {
    assert.ok(deliveryRuleAt(mode, deliveryLateClass) > deliveryAdded)
    assert.ok(deliveryTiming[mode].latePaint > deliveryRuleAt(mode, deliveryLateClass))
  }
  const progressive = deliveryTiming.progressive
  assert.ok(deliveryAdded < progressive.loading)
  assert.ok(progressive.loading < progressive.ready)
  assert.ok(progressive.ready < progressive.lateRule)
  assert.ok(deliveryTiming.runtime.reference < deliveryTiming.runtime.rules)
})
