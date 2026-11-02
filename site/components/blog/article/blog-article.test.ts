import assert from 'node:assert/strict'
import { test } from 'node:test'
import { compareBlogDates, neighborsOf, type BlogArticleNeighbor } from './neighbors'
import { titleParts } from './title-parts'
import { contentLanguageOf, sourceLanguageOf } from './language'

const post = (name: string, date: string) => ({ title: name, date, pathname: `/blog/${name}`, sourcePath: `site/content/blog/${name}/content.mdx` })
const categories = [{ pages: [post('b', '2025-04-22'), post('c', '2026-06-15')] }, { pages: [post('a', '2023-12-19')] }]

test('undated announcements precede dated posts without a synthetic date', () => {
  const release: BlogArticleNeighbor = { title: 'Master CSS 2.0', pathname: '/blog/v2', sourcePath: 'site/content/blog/v2/content.mdx' }
  const all = [...categories, { pages: [release] }]
  assert.equal(compareBlogDates(release, release), 0)
  assert.equal(all.flatMap(group => group.pages).sort(compareBlogDates)[0], release)
  assert.deepEqual(neighborsOf(release.sourcePath, all), { newer: undefined, older: categories[0].pages[1] })
})

test('neighbours follow the index order, newest first, across categories', () => {
  assert.deepEqual(neighborsOf(post('c', '').sourcePath, categories), { newer: undefined, older: categories[0].pages[0] })
  assert.deepEqual(neighborsOf(post('b', '').sourcePath, categories), { newer: categories[0].pages[1], older: categories[1].pages[0] })
  assert.deepEqual(neighborsOf(post('a', '').sourcePath, categories), { newer: categories[0].pages[0], older: undefined })
  assert.deepEqual(neighborsOf('unlisted', categories), { newer: undefined, older: categories[0].pages[1] })
  assert.deepEqual(neighborsOf(post('a', '').sourcePath, [{ pages: [post('a', '2023-12-19')] }]), { newer: undefined, older: undefined })
})

test('a title splits at its first colon, keeping a full-width colon without an added space', () => {
  assert.equal(titleParts('Master CSS 2.0'), undefined)
  assert.equal(titleParts('Notes:'), undefined)
  assert.deepEqual(titleParts('Master CSS with Vite: choose when to generate CSS'), { first: 'Master CSS with Vite:', space: true, second: 'choose when to generate CSS' })
  assert.deepEqual(titleParts('在 Vite 使用 Master CSS：何時產生 CSS'), { first: '在 Vite 使用 Master CSS：', space: false, second: '何時產生 CSS' })
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
