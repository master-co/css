import { SourceMap } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { stylesheetOutputMap } from '../../src/stylesheet/output-map'

test.each(['entry.css', 'entry #.css', 'entry%20.css'])('maps an absolute filesystem path as a file URL: %s', name => {
  const file = join(tmpdir(), 'master-source-map', name)
  const css = '.card{color:red}'
  const sourceMap = stylesheetOutputMap(css, [{
    generatedStart: 0, generatedEnd: css.length,
    source: { file, range: { start: 0, end: css.length } }
  }], { file, compilationFile: file, source: css })
  const payload = JSON.parse(sourceMap)
  expect(payload.sources).toEqual([pathToFileURL(file).href])
  expect(payload.sourcesContent).toEqual([css])
  expect(new SourceMap(payload).findEntry(0, 0)).toMatchObject({
    originalSource: pathToFileURL(file).href, originalLine: 0, originalColumn: 0
  })
})
