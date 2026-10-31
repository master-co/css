import assert from 'node:assert/strict'
import { test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { neighborsOf } from './neighbors'
import { titleLines } from './title-lines'
import { contentLanguageOf, sourceLanguageOf } from './language'

const post = (name: string, date: string) => ({ title: name, date, pathname: `/blog/${name}`, sourcePath: `site/content/blog/${name}/content.mdx` })
const categories = [{ pages: [post('b', '2025-04-22'), post('c', '2026-06-15')] }, { pages: [post('a', '2023-12-19')] }]

test('neighbours follow the index order, newest first, across categories', () => {
  assert.deepEqual(neighborsOf(post('c', '').sourcePath, categories), { newer: undefined, older: categories[0].pages[0] })
  assert.deepEqual(neighborsOf(post('b', '').sourcePath, categories), { newer: categories[0].pages[1], older: categories[1].pages[0] })
  assert.deepEqual(neighborsOf(post('a', '').sourcePath, categories), { newer: categories[0].pages[0], older: undefined })
  assert.deepEqual(neighborsOf('unlisted', categories), { newer: undefined, older: categories[0].pages[1] })
  assert.deepEqual(neighborsOf(post('a', '').sourcePath, [{ pages: [post('a', '2023-12-19')] }]), { newer: undefined, older: undefined })
})

test('a title splits at its first colon, keeping a full-width colon without an added space', () => {
  assert.equal(titleLines('Master CSS 2.0', 'line'), 'Master CSS 2.0')
  assert.equal(titleLines('Notes:', 'line'), 'Notes:')
  assert.equal(renderToStaticMarkup(<>{titleLines('Master CSS with Vite: choose when to generate CSS', 'line')}</>), '<span class="line">Master CSS with Vite:</span> <span class="line">choose when to generate CSS</span>')
  assert.equal(renderToStaticMarkup(<>{titleLines('在 Vite 使用 Master CSS：何時產生 CSS', 'line')}</>), '<span class="line">在 Vite 使用 Master CSS：</span><span class="line">何時產生 CSS</span>')
})

test('text a translated page leaves untranslated keeps the source language', () => {
  const tw = { locale: 'tw', defaultLocale: 'en', translations: { 'All articles': '所有文章' }, hreflangOfLocale: { tw: 'zh-TW' } }
  assert.equal(sourceLanguageOf('Master CSS with Vite: choose when to generate CSS', tw), 'en')
  assert.equal(sourceLanguageOf('All articles', tw), undefined)
  assert.equal(sourceLanguageOf(undefined, tw), undefined)
  assert.equal(sourceLanguageOf('Master CSS with Vite: choose when to generate CSS', { ...tw, locale: 'en' }), undefined)
})

test('a translated page reads its body in the source language until a content.<locale>.mdx exists', () => {
  const tw = { locale: 'tw', defaultLocale: 'en', hreflangOfLocale: { tw: 'zh-TW' } }
  const source = 'site/content/blog/master-css-next/content.mdx'
  assert.equal(contentLanguageOf(source, new Set(), tw), 'en')
  assert.equal(contentLanguageOf(source, new Set(['/content/blog/master-css-next/content.tw.mdx']), tw), undefined)
  assert.equal(contentLanguageOf(source, new Set(['/content/blog/other/content.tw.mdx']), tw), 'en')
  assert.equal(contentLanguageOf(source, new Set(), { ...tw, locale: 'en' }), undefined)
})
