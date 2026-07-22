import { expect, test } from 'vitest'
import { loadRustInspectionReportCreator } from '../src/rust-report'
import createInspectionReportOracle, { type InspectionReportOracleInput } from './inspection-report-oracle'

test('keeps the Rust inspection report byte-shape equivalent to the TypeScript oracle', async () => {
  const input: InspectionReportOracleInput = {
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
      blocklist: ['/^blocked$/'],
      blockedClasses: ['blocked'],
      safelistCount: 1,
      blocklistCount: 1,
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
  expect(await createReport(input)).toEqual(createInspectionReportOracle(input))
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
