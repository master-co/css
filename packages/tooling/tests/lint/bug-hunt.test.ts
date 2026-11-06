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
