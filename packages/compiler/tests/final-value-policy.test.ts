import { describe, expect, it } from 'vitest'
import { compileManifestSync, createCompilerSync } from '../src/node'
import { validateCompiledCSS } from '../src/value-validation'

const baseManifest = { version: 1, languageVersion: 3 } as const

describe('preserve and diagnose CSS values', () => {
  it('preserves invalid managed declarations and checks their expanded result', () => {
    const source = '@utilities { cols:<*> { grid-template-columns:repeat(--value(),minmax(0,1fr)); } }.card{@compose cols:2.5;}'
    const result = compileManifestSync(source, { baseManifest })
    expect(result.css).toContain('repeat(2.5')
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CSS_VALUE_INVALID' })]))
    expect(() => compileManifestSync(source, { baseManifest, validation: 'error' })).toThrow('Strict CSS validation failed')
  })

  it('unknown abilities do not fail strict value checking', () => {
    const diagnostics = validateCompiledCSS([{ css: '.a{width:--space(2);padding:var(--p);future-property:future(2qu)}' }], { validation: 'error' })
    expect(diagnostics).toHaveLength(3)
    expect(diagnostics.every(diagnostic => diagnostic.code === 'CSS_VALUE_UNKNOWN')).toBe(true)
  })

  it('preserves valid descriptor values during strict compilation', () => {
    const result = compileManifestSync('@font-face{font-family:Variable;src:url(variable.woff2);font-weight:100 900}@page{size:A4;margin:1cm}', { baseManifest, validation: 'error' })
    expect(result.css).toMatch(/font-weight:\s*100 900/)
    expect(result.diagnostics.filter(d => d.severity === 'error')).toEqual([])
  })

  it('validates all delivered stylesheets before returning a strict result', () => {
    using compiler = createCompilerSync()
    const request = {
      graph: { entry: '/entry.css', files: {
        '/entry.css': '@import "./child.css";', '/child.css': '.bad{font:16px}'
      }, edges: [{ from: '/entry.css', specifier: './child.css', resolved: '/child.css' }] },
      urls: { '/entry.css': '/entry.css', '/child.css': '/child.css' },
      baseManifest
    }
    const result = compiler.compileStylesheets(request)
    expect(result.stylesheets.find(asset => asset.id === '/child.css')?.css).toMatch(/font:\s*16px/)
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CSS_VALUE_INVALID', source: '/child.css', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } })]))
    expect(() => compiler.compileStylesheets(request, { validation: 'error' })).toThrow('Strict CSS validation failed')
  })
})

it('rejects the removed value-only policy explicitly', () => {
  expect(() => compileManifestSync('.a{padding:1px}', { baseManifest, cssValuePolicy: 'error' } as never)).toThrow('cssValuePolicy was removed')
})
