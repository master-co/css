import { expect, test } from 'vitest'
import { fixMasterCSSContent, lintMasterCSSContent } from '../../src/lint'
import { createTestToolingSession } from '../helpers/create-tooling-session'

test('audit control: source fixes converge and preserve Unicode surrounding markup', () => {
  using session = createTestToolingSession()
  for (const classList of ["fg-red (display:block) (display:block)", '(font-size:16px) w-md h-md', "fg-blue fg-red (display:block)"]) {
    const prefix = '<!-- 😀 中 -->\r\n<div data-note="keep" class="'
    const suffix = '">keep</div>\r\n'
    let content = prefix + classList + suffix
    const options = { filePath: 'component.html', lintSession: session }
    for (let iteration = 0; iteration < 5; iteration++) {
      const next = fixMasterCSSContent({ ...options, content })
      if (next === content) break
      content = next
    }
    expect(fixMasterCSSContent({ ...options, content })).toBe(content)
    expect(content.startsWith(prefix)).toBe(true)
    expect(content.endsWith(suffix)).toBe(true)
    for (const diagnostic of lintMasterCSSContent({ ...options, content }).diagnostics) {
      expect(diagnostic.range.start).toBeGreaterThanOrEqual(prefix.length)
      expect(diagnostic.range.end).toBeLessThanOrEqual(content.length - suffix.length)
    }
  }
})

test('bound Vue class props only sort the class lists inside their expression (#493)', () => {
  using session = createTestToolingSession()
  const content = '<template>\n  <div :class="active ? \'\' : `p(8) flex`" />\n  <MyItem :content-class="active ? \'\' : `p(8) flex`" />\n  <MyItem v-bind:item-class="active ? \'\' : `p(8) flex`" />\n  <MyItem content-class="p(8) flex" />\n</template>\n'
  const options = { content, filePath: 'Repro.vue', lintSession: session }
  const diagnostics = lintMasterCSSContent(options).diagnostics
  expect(diagnostics.map(({ code, loc }) => [code, loc.start.line])).toEqual([
    ['invalid-class-order', 2],
    ['invalid-class-order', 3],
    ['invalid-class-order', 4],
    ['invalid-class-order', 5]
  ])
  for (const diagnostic of diagnostics) {
    expect(content.slice(diagnostic.range.start, diagnostic.range.end)).toBe('p(8) flex')
    expect(diagnostic.fixes?.map(({ text }) => text)).toEqual(['flex p(8)'])
  }
  expect(fixMasterCSSContent(options)).toBe(content.replaceAll('p(8) flex', 'flex p(8)'))
})

test('reports conditional classes that the static class always overrides (#495)', () => {
  using session = createTestToolingSession()
  const content = [
    '<script setup lang="ts">',
    'defineProps<{ disabled: boolean }>()',
    '</script>',
    '',
    '<template>',
    '  <button class="(cursor:pointer) (cursor:not-allowed)">same attribute</button>',
    '  <button class="(cursor:pointer)" :class="{ \'(cursor:not-allowed)\': disabled }">split</button>',
    '  <button :class="[\'(cursor:pointer)\', disabled && \'(cursor:not-allowed)\']">array</button>',
    '  <button class="(cursor:not-allowed)" :class="{ \'(cursor:pointer)\': !disabled }">wins</button>',
    '  <button :class="disabled ? \'(cursor:not-allowed)\' : \'(cursor:pointer)\'">ternary</button>',
    '</template>',
    ''
  ].join('\n')
  const options = { content, filePath: 'Button.vue', lintSession: session }
  const diagnostics = lintMasterCSSContent(options).diagnostics
    .filter(({ ruleId }) => ruleId === 'no-conflicting-classes')
  expect(diagnostics.map(({ code, loc }) => [code, loc.start.line])).toEqual([
    ['conflicting-class', 6],
    ['element-conflicting-class', 7],
    ['element-conflicting-class', 8]
  ])
  for (const diagnostic of diagnostics.slice(1)) {
    expect(content.slice(diagnostic.range.start, diagnostic.range.end)).toBe('(cursor:not-allowed)')
    expect(diagnostic.message).toMatch(/^Class "\(cursor:not-allowed\)" never applies, even when its condition is met; class "\(cursor:pointer\)"/)
    expect(diagnostic.fixes).toBeUndefined()
  }
  expect(lintMasterCSSContent({ ...options, rules: { 'no-conflicting-classes': false } }).diagnostics
    .some(({ code }) => code === 'element-conflicting-class')).toBe(false)
})

test('opt-in no-legacy-classes points pre-2.0 classes to their 2.0 spelling (#496)', () => {
  using session = createTestToolingSession()
  const content = '<template>\n  <div class="flex align-items:center p:8px font-size:12px flex:1 w:full p:8">rc syntax</div>\n</template>\n'
  const options = { content, filePath: 'Legacy.vue', lintSession: session }
  expect(lintMasterCSSContent(options).diagnostics.some(({ ruleId }) => ruleId === 'no-legacy-classes')).toBe(false)
  const rules = { 'no-legacy-classes': true }
  const diagnostics = lintMasterCSSContent({ ...options, rules }).diagnostics
    .filter(({ ruleId }) => ruleId === 'no-legacy-classes')
  expect(diagnostics.map(({ data }) => [data?.className, data?.replacement])).toEqual([
    ['align-items:center', 'items-center'],
    ['p:8px', 'p(8)'],
    ['font-size:12px', '(font-size:12px)'],
    ['flex:1', '(flex:1)'],
    ['w:full', 'w-full'],
    // `(padding:8)` fails the host CSS value check, so no replacement is offered.
    ['p:8', undefined]
  ])
  expect(diagnostics.at(-1)?.fixes).toBeUndefined()
  expect(fixMasterCSSContent({ ...options, rules: { ...rules, 'sort-classes': false } }))
    .toBe(content.replace('flex align-items:center p:8px font-size:12px flex:1 w:full', 'flex items-center p(8) (font-size:12px) (flex:1) w-full'))
  // The flex:1 syntax error now names its 2.0 native declaration.
  expect(lintMasterCSSContent(options).diagnostics.find(({ ruleId }) => ruleId === 'no-invalid-classes')?.message)
    .toBe('Pre-2.0 property:value syntax: write (flex:1) instead of flex:1')
  expect(session.inspectClassName('font-size:12px').diagnostics?.[0]?.message)
    .toBe('Pre-2.0 property:value syntax: write (font-size:12px) instead of font-size:12px')
})
