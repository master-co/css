import { SourceMap } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { MasterCSSError } from '@master/css-schema'
import { expect, test } from 'vitest'
import { compileCSS } from '../src/node-compiler'
import { resolveReferenceOrigins } from '../src/stylesheet/reference-origins'
import { mapStylesheetError } from '../src/stylesheet/source-context'
import { stylesheetOutputMap, stylesheetValidationSource } from '../src/stylesheet/output-map'

for (const kind of ['absolute', 'absolute-root', 'file-url']) {
  const owner = join(tmpdir(), 'map-owner.scss'), directory = join(tmpdir(), 'source #100%20')
  const file = join(directory, 'partial.scss'), source = '@reference "./tokens.css";'
  const sourceMap = JSON.stringify({ version: 3, names: [],
    sourceRoot: kind === 'absolute-root' ? directory : '',
    sources: [kind === 'absolute-root' ? 'partial.scss' : kind === 'file-url' ? pathToFileURL(file).href : file],
    sourcesContent: [source], mappings: 'AAAA'
  })

  test(`${kind} source maps retain filesystem identity for reference resolution`, () => {
    expect(resolveReferenceOrigins(source, compileCSS(source).references!, owner, sourceMap))
      .toEqual([expect.objectContaining({ source: './tokens.css', file })])
  })

  test(`${kind} source maps retain filesystem identity in output and validation`, () => {
    const mappings = [{ generatedStart: 0, generatedEnd: source.length, source: { file: owner, range: { start: 0, end: source.length } } }]
    const output = stylesheetOutputMap(source, mappings, { file: owner, compilationFile: owner, source, sourceMap })
    expect(new SourceMap(JSON.parse(output)).findEntry(0, 0)).toMatchObject({ originalSource: pathToFileURL(file).href })
    expect(stylesheetValidationSource(source, owner, sourceMap).locate?.({ start: 0, end: 10 }))
      .toMatchObject({ source: file, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } } })
  })

  test(`${kind} source maps retain filesystem identity in diagnostics`, () => {
    const error = new MasterCSSError({ code: 'invalid-reference', domain: 'compiler', message: 'Invalid reference', diagnostics: [
      { version: 2, code: 'invalid-reference', domain: 'compiler', severity: 'error', message: 'Invalid reference', source: owner,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } } }
    ] })
    expect(mapStylesheetError(error, owner, { sourceMap }, source)).toMatchObject({ diagnostics: [
      expect.objectContaining({ source: file, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } } })
    ] })
  })
}
