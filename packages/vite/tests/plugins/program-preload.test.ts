import { describe, expect, it } from 'vitest'
import ProgramPreloadPlugin from '../../src/plugins/program-preload'

const program = new Uint8Array([77, 67, 83, 80])
const bundle = {
  'assets/master-css-program.CzuVhIZV.bin': {
    type: 'asset',
    name: 'master-css-program.bin',
    fileName: 'assets/master-css-program.CzuVhIZV.bin',
    source: new Uint8Array(program)
  }
}

function transform(context: object, html: string, htmlContext: object) {
  const plugin = ProgramPreloadPlugin(context as never)
  return (plugin.transformIndexHtml as any).handler.call({}, html, htmlContext)
}

describe('ProgramPreloadPlugin', () => {
  it('injects a fetch preload link for the emitted default program asset', () => {
    const result = transform(
      { defaultProgramAssetReferenceId: 'master_css_program_ref', defaultProgramAssetSource: program, config: { base: '/' } },
      '<html><head></head><body></body></html>',
      { path: '/index.html', bundle }
    )

    expect(result.html).toBe('<html><head></head><body></body></html>')
    expect(result.tags).toEqual([
      {
        tag: 'link',
        attrs: {
          rel: 'preload',
          as: 'fetch',
          crossorigin: '',
          href: '/assets/master-css-program.CzuVhIZV.bin'
        },
        injectTo: 'head-prepend'
      }
    ])
  })

  it('ignores a program asset with other bytes', () => {
    const result = transform(
      { defaultProgramAssetReferenceId: 'master_css_program_ref', defaultProgramAssetSource: new Uint8Array([1]), config: { base: '/' } },
      '<html><head></head><body></body></html>',
      { path: '/index.html', bundle }
    )

    expect(result).toBeUndefined()
  })

  it('does not inject in dev or before the default program asset is emitted', () => {
    expect(transform({ config: { base: '/' } }, '<html><head></head><body></body></html>', { path: '/index.html', bundle: {} })).toBeUndefined()
  })

  it('does not inject without a build bundle context', () => {
    expect(transform(
      { defaultProgramAssetReferenceId: 'master_css_program_ref', defaultProgramAssetSource: program, config: { base: '/' } },
      '<html><head></head><body></body></html>',
      { path: '/index.html' }
    )).toBeUndefined()
  })

  it('does not inject a duplicate program preload link', () => {
    const html = '<html><head><link rel="preload" as="fetch" crossorigin href="/assets/master-css-program.CzuVhIZV.bin"></head></html>'
    expect(transform(
      { defaultProgramAssetReferenceId: 'master_css_program_ref', defaultProgramAssetSource: program, config: { base: '/' } },
      html,
      { path: '/index.html', bundle }
    )).toBeUndefined()
  })
})
