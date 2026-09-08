import { createCompilerBindingSession } from '@master/css-binding/compiler'
import { expect, test } from 'vitest'

test('BH-0020 native inspection counts UTF-8 CSS bytes independently of text inclusion', async () => {
  const compiler = await createCompilerBindingSession({ binding: 'native' })
  try {
    for (const included of [false, true]) {
      for (const [text, bytes] of [['', 0], ['abc', 3], ['é中文😀', 12]] as const) {
        const report = await compiler.createInspectionReport({
          version: 1, cwd: '/', patterns: [], files: [], classes: [],
          scanner: {}, stylesheets: {}, css: { text, included }
        })
        expect(report.css.bytes).toBe(bytes)
        expect(report.css.text).toBe(included ? text : undefined)
      }
    }
  } finally {
    compiler.dispose()
  }
})
