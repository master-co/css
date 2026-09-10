import assert from 'node:assert/strict'
import { SourceMap } from 'node:module'

function mappedPoint(payload, line, column) {
  if (payload.sections) {
    const section = payload.sections.filter(section => section.offset.line < line || section.offset.line === line && section.offset.column <= column).at(-1)
    assert.ok(section?.map, 'The generated CSS position has an embedded map section')
    return mappedPoint(section.map, line - section.offset.line, line === section.offset.line ? column - section.offset.column : column)
  }
  const entry = new SourceMap(payload).findEntry(line, column)
  return { entry, content: payload.sourcesContent?.[payload.sources.indexOf(entry.originalSource)] }
}

/** Inspect the actual CSS delivered to the browser, after host CSS Modules. */
export async function verifyNextCSSSourceMaps(page, expectedFile) {
  const styles = await page.evaluate(async () => {
    const selector = '.' + CSS.escape(document.querySelector('#module').className.split(' ')[0])
    const files = await Promise.all(Array.from(document.styleSheets, async sheet => ({
      url: sheet.href || location.href,
      css: sheet.href ? await (await fetch(sheet.href)).text() : sheet.ownerNode.textContent
    })))
    return { selector, files }
  })
  const evidence = []
  for (const file of styles.files) {
    const offset = file.css.indexOf(styles.selector)
    if (offset < 0) continue
    const reference = [...file.css.matchAll(/[#@]\s*sourceMappingURL=([^\s*]+)/g)].at(-1)?.[1]
    if (!reference) { evidence.push({ cssURL: file.url, missingMap: true });continue }
    let payload
    if (reference.startsWith('data:')) {
      const comma = reference.indexOf(',')
      payload = JSON.parse(reference.slice(0, comma).includes(';base64')
        ? Buffer.from(reference.slice(comma + 1), 'base64').toString('utf8') : decodeURIComponent(reference.slice(comma + 1)))
    } else {
      const response = await fetch(new URL(reference, file.url))
      assert.equal(response.status, 200, 'CSS source map is served')
      payload = await response.json()
    }
    const lines = file.css.slice(0, offset).split('\n')
    const { entry, content } = mappedPoint(payload, lines.length - 1, lines.at(-1).length)
    assert.ok('originalSource' in entry && entry.originalSource, JSON.stringify({ file: file.url, entry }))
    const source = decodeURIComponent(entry.originalSource)
    assert.ok(source.includes(expectedFile), JSON.stringify({ source, expectedFile }))
    assert.ok(content?.split(/\r\n?|\n/)[entry.originalLine]?.includes('.card'), JSON.stringify({ source, entry, content }))
    evidence.push({ cssURL: file.url, source, line: entry.originalLine, column: entry.originalColumn, sourceContent: content })
  }
  assert.ok(evidence.some(item => item.source), JSON.stringify({ selector: styles.selector, evidence, files: styles.files.map(file => file.url) }))
  return evidence
}
