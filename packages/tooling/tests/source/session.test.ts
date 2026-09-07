import { expect, test } from 'vitest'
import { createTestToolingSession } from '../helpers/create-tooling-session'

test('extracts built-in source formats through the native Rust session', () => {
  const extractor = createTestToolingSession()

  expect(extractor.binding).toBe('native')
  expect(extractor.extractSource({
    files: [{
      source: 'index.html',
      content: '<div class="block fg:red"></div>',
      kind: 'html'
    }]
  }).files[0].candidates).toEqual(['block', 'fg:red'])
  expect(extractor.extractSource({
    files: [{
      source: 'index.tsx',
      content: '<div className="text:center" />',
      kind: 'oxc'
    }]
  }).files[0].candidates).toContain('text:center')

  expect(extractor.extractSource({
    files: [
      { source: 'index.html', content: '<div class="grid"></div>' },
      { source: 'index.ts', content: 'const value = "flex"' }
    ]
  }).files.map(({ candidates }) => candidates)).toEqual([['grid'], ['flex']])

  extractor.dispose()
  expect(() => extractor.extractSource({ files: [] })).toThrow('disposed')
})

test('extracts static classes from JavaScript and TypeScript syntax with Oxc', () => {
  const extractor = createTestToolingSession()
  try {
    expect(extractor.extractSource({
      files: [{
        source: 'component.tsx',
        kind: 'oxc',
        content: `
          const classes = 'block mx:auto'
          const active = clsx('fg:red', { 'p:4x': ok })
          element.classList.add('flex')
          export function App() {
            return <div className="hidden m:2x" />
          }
        `
      }]
    }).files[0].candidates).toEqual([
      'block',
      'mx:auto',
      'fg:red',
      'p:4x',
      'flex',
      'hidden',
      'm:2x'
    ])
  } finally {
    extractor.dispose()
  }
})
