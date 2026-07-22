import { createSourceExtractorSync } from '../src/node'
import { expect, test } from 'vitest'

test('extracts built-in source formats through the native Rust session', () => {
  const extractor = createSourceExtractorSync()

  expect(extractor.backend).toBe('native')
  expect(extractor.extractHTMLClasses('index.html', '<div class="block fg:red"></div>'))
    .toEqual(['block', 'fg:red'])
  expect(extractor.extractOxcClasses('index.tsx', '<div className="text:center" />'))
    .toContain('text:center')

  expect(extractor.extract({
    files: [
      { source: 'index.html', content: '<div class="grid"></div>' },
      { source: 'index.ts', content: 'const value = "flex"' }
    ]
  }).files.map(({ candidates }) => candidates)).toEqual([['grid'], ['flex']])

  extractor.dispose()
  expect(() => extractor.extract({ files: [] })).toThrow('disposed')
})
