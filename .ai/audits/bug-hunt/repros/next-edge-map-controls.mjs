import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { SourceMap } from 'node:module'

const evidence = JSON.parse(readFileSync(process.env.BH_NEXT_HOST_EVIDENCE, 'utf8'))
const checks = []
// These authored rules acquire only an ICSS composition and intentionally emit
// no own declarations. Their referenced leaf still requires an original anchor.
const emptyComposedChild = evidence.input.addNestedComposes && ['.shared{}', '@media screen{.shared{}}', '@theme{--color-unused:red}.shared{}'].includes(evidence.input.b)
const omitted = emptyComposedChild ? [{ file: 'app/other.module.css', reason: 'Known fixture has no own emitted declaration after ICSS removal' }] : []
if (emptyComposedChild) assert(!evidence.stylesheets.some(item => item.file.endsWith('.css') && item.text.includes('.other_shared__')), 'No own child rule expected in these fixtures')
for (const [file, emitted, selector] of [
  ['app/card.module.css', '.card_direct__', evidence.input.renameExports ? '.original' : '.direct'],
  ...(!emptyComposedChild && (evidence.input.a.includes('composes:shared') || evidence.input.addComposes || evidence.input.inspectImport)) ? [['app/' + (evidence.input.file || 'other.module.css'), '.other_shared__', '.shared']] : [],
  ...(evidence.input.b.includes('.shared{display:block}.sibling{display:block}')) ? [['app/other.module.css', '.other_sibling__', '.sibling']] : [],
  ...evidence.input.addNestedComposes ? [['app/nested/leaf.module.css', '.leaf_leaf__', '.leaf']] : []
]) {
  try {
    const source = evidence.authoredStylesheets.find(item => item.file === file)?.text
    assert(source?.includes(selector), 'independently captured source required')
    const css = evidence.stylesheets.find(item => item.file.endsWith('.css') && item.text.includes(emitted))
    assert(css, 'emitted selector required')
    const href = css.text.match(/sourceMappingURL=([^\s*]+)/)?.[1]
    assert(href, 'map URL required')
    const mapFile = new URL(href, 'https://audit.invalid/' + css.file).pathname.slice(1)
    const payload = JSON.parse(evidence.stylesheets.find(item => item.file === mapFile).text)
    const before = css.text.slice(0, css.text.indexOf(emitted)).split('\n')
    const position = new SourceMap(payload).findEntry(before.length - 1, before.at(-1).length)
    const authored = source.slice(0, source.indexOf(selector)).split('\n')
    assert(position.originalSource?.endsWith('/' + file), JSON.stringify(position))
    assert.equal(position.originalLine, authored.length - 1)
    assert.equal(position.originalColumn, authored.at(-1).length)
    assert.equal(payload.sourcesContent[payload.sources.indexOf(position.originalSource)], source)
    checks.push({ file, selector, position, fullSource: true, pass: true })
  } catch (error) { checks.push({ file, selector, error: String(error), pass: false }) }
}
const result = { scenario: evidence.scenario, scope: 'Actual published selector anchors only; no claim for every declaration or generated global', checks, omitted }
writeFileSync(process.env.BH_NEXT_MAP_EVIDENCE, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(result))
process.exitCode = checks.every(check => check.pass) ? 0 : 1
