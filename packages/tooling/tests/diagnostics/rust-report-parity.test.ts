import { expect, test } from 'vitest'
import { loadRustInspectionReportCreator } from '../../src/diagnostics/rust-report'
import type { MasterCSSDiagnosticsReportInputIR, MasterCSSInspectionReportIR } from '@master/css-schema'

test('lets Rust own inspection classification, counts, sorting, and report shape', async () => {
  const input: MasterCSSDiagnosticsReportInputIR = {
    version: 1,
    cwd: '/project',
    patterns: ['src/**/*.html'],
    files: [{
      filePath: '/project/src/index.html',
      source: 'src/index.html',
      scanned: true,
      changed: true,
      discovered: {
        latent: ['bad', 'block', 'block'],
        valid: ['block'],
        invalid: ['bad'],
        usedNative: []
      }
    }],
    classes: ['block', 'native', 'safe', 'bad', 'blocked', 'missing'],
    scanner: {
      latent: ['bad', 'block'],
      valid: ['block'],
      invalid: ['bad'],
      usedNative: ['native'],
      safelist: ['safe'],
      blocklist: [{ source: '^blocked$', flags: '' }],
      resetDependencies: ['/project/reset.css', '/project/reset.css']
    },
    stylesheets: {
      entries: [{
        filePath: '/project/index.css',
        masterCSS: true,
        pruneNativeCSS: false,
        dependencies: ['/project/b.css', '/project/a.css', '/project/a.css'],
        sourceDependencies: ['/project/src/index.html'],
        warnings: ['entry warning'],
        errors: []
      }],
      warnings: ['entry warning', 'entry warning'],
      errors: [{ filePath: '/project/broken.css', message: 'broken import' }]
    },
    css: {
      text: '😀.block{display:block}',
      included: true,
      variables: ['color', 'color'],
      animations: ['fade']
    },
    firstSourceByClass: {
      bad: '/project/src/index.html'
    }
  }
  const createReport = await loadRustInspectionReportCreator()
  const report = await createReport<MasterCSSInspectionReportIR>(input)
  expect(report).toMatchObject({
    scanner: {
      counts: {
        latent: 2,
        valid: 1,
        invalid: 1,
        usedNative: 1,
        safelist: 1,
        blocklist: 1
      },
      classes: {
        latent: ['bad', 'block'],
        valid: ['block'],
        invalid: ['bad'],
        usedNative: ['native'],
        safelist: ['safe'],
        blocklist: ['/^blocked$/']
      },
      resetDependencies: ['/project/reset.css']
    },
    missingCSS: {
      missing: expect.arrayContaining([
        { className: 'bad', status: 'missing', reason: 'invalid' },
        { className: 'blocked', status: 'missing', reason: 'blocklisted' },
        { className: 'missing', status: 'missing', reason: 'not-detected' }
      ])
    },
    css: {
      bytes: 23,
      emittedGlobals: { variables: 1, animations: 1 }
    },
    summary: {
      files: 1,
      stylesheets: 1,
      invalidClasses: 1
    }
  })
})

test('uses tooling Wasm when native addons are disabled', async () => {
  process.execArgv.push('--no-addons')
  try {
    const createReport = await loadRustInspectionReportCreator()
    const report = await createReport<{
      version: number
      missingCSS: { missing: { className: string }[] }
    }>({
      version: 1,
      cwd: '/project',
      patterns: [],
      files: [],
      classes: ['missing'],
      scanner: {},
      stylesheets: {},
      css: {}
    })
    expect(report).toMatchObject({
      version: 1,
      missingCSS: { missing: [{ className: 'missing' }] }
    })
  } finally {
    process.execArgv.splice(process.execArgv.lastIndexOf('--no-addons'), 1)
  }
})
