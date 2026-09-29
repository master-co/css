import { expect, test } from 'vitest'
import { createTestToolingSession } from '../helpers/create-tooling-session'

test('extracts built-in source formats through the native Rust session', () => {
  const extractor = createTestToolingSession()

  expect(extractor.binding).toBe('native')
  expect(extractor.extractSource({
    files: [{
      source: 'index.html',
      content: '<div class="display:block fg-red"></div>',
      kind: 'html'
    }]
  }).files[0].candidates).toEqual(["display:block", 'fg-red'])
  expect(extractor.extractSource({
    files: [{
      source: 'index.tsx',
      content: '<div className="text:center" />',
      kind: 'oxc'
    }]
  }).files[0].candidates).toContain('text:center')

  expect(extractor.extractSource({
    files: [
      { source: 'index.html', content: '<div class="display:grid"></div>' },
      { source: 'index.ts', content: 'const value = "display:flex"' }
    ]
  }).files.map(({ candidates }) => candidates)).toEqual([["display:grid"], ["display:flex"]])

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
        content: "\n          const classes = 'display:block margin-inline:auto'\n          const active = clsx('fg-red', { 'padding:1rem': ok })\n          element.classList.add('display:flex')\n          export function App() {\n            return <div className=\"display:none margin:0.5rem\" />\n          }\n        "
      }]
    }).files[0].candidates).toEqual([
      "display:block",
      "margin-inline:auto",
      'fg-red',
      "padding:1rem",
      "display:flex",
      "display:none",
      "margin:0.5rem"
    ])
  } finally {
    extractor.dispose()
  }
})
