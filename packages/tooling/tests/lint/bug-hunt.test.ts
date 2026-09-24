import { expect, test } from 'vitest'
import { fixMasterCSSContent, lintMasterCSSContent } from '../../src/lint'
import { createTestToolingSession } from '../helpers/create-tooling-session'

test('audit control: source fixes converge and preserve Unicode surrounding markup', () => {
  using session = createTestToolingSession()
  for (const classList of ['fg-red block block', 'font-size:16px w-md h-md', 'fg-blue fg-red block']) {
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
