import { describe, expect, it } from 'vitest'
import { compileManifestSync, createCompilerSync } from '../src/node'
import { validateCompiledCSS } from '../src/value-validation'

const baseManifest = { version: 1, languageVersion: 2 } as const

describe('preserve and diagnose CSS values', () => {
  it('preserves invalid managed declarations and checks their expanded result', () => {
    const source = '@utilities { cols:<number|*> { grid-template-columns:repeat(--value(),minmax(0,1fr)); } }.card{@compose cols:2.5;}'
    const result = compileManifestSync(source, { baseManifest })
    expect(result.css).toContain('repeat(2.5')
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CSS_VALUE_INVALID' })]))
    expect(() => compileManifestSync(source, { baseManifest, cssValuePolicy: 'error' })).toThrow('Strict CSS validation failed')
  })

  it('unknown abilities do not fail strict value checking', () => {
    const diagnostics = validateCompiledCSS([{ css: '.a{width:--space(2);padding:var(--p);future-property:future(2qu)}' }], { cssValuePolicy: 'error' })
    expect(diagnostics).toHaveLength(3)
    expect(diagnostics.every(diagnostic => diagnostic.code === 'CSS_VALUE_UNKNOWN')).toBe(true)
  })

  it('preserves valid descriptor values during strict compilation', () => {
    const result = compileManifestSync('@font-face{font-family:Variable;src:url(variable.woff2);font-weight:100 900}@page{size:A4;margin:1cm}', { baseManifest, cssValuePolicy: 'error' })
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
    expect(result.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'CSS_VALUE_INVALID', source: '/child.css#generated' })]))
    expect(() => compiler.compileStylesheets(request, { cssValuePolicy: 'error' })).toThrow('Strict CSS validation failed')
  })
})
