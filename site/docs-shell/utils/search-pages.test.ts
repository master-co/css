import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import {
  createDictionaryTranslate,
  createLocalizedPathname,
  createSearchPage,
  extractSearchNodesFromMdx
} from './search-pages'

test('extractSearchNodesFromMdx reads markdown text, code, list items, and resolved heading ids', () => {
  const nodes = extractSearchNodesFromMdx([
    "import Demo from './Demo'",
    '',
    '## Overview [sr-only]',
    '',
    'Use `text-body` for readable copy.',
    '',
    '- First **item**',
    '- Second item',
    '',
    '```html',
    '<div class="text-body">Hello</div>',
    '```',
    '',
    '<Demo />'
  ].join('\n'))

  assert.deepEqual(nodes, [
    { id: 'overview', tag: 'h2', text: 'Overview' },
    { tag: 'p', text: 'Use text-body for readable copy.' },
    { tag: 'li', text: 'First item' },
    { tag: 'li', text: 'Second item' },
    { tag: 'code', text: '<div class="text-body">Hello</div>' }
  ])
})

test('createSearchPage localizes metadata and prefixes non-default locales', () => {
  const translate = createDictionaryTranslate({
    Colors: '色彩',
    'Choose palette steps.': '選擇色階。',
    'Design Foundations': '設計基礎'
  })
  const page = createSearchPage({
    defaultLocale: 'en',
    entry: {
      content: '## Default palette\nUse `bg-blue`.',
      metadata: {
        category: 'Design Foundations',
        description: 'Choose palette steps.',
        pathname: '/guide/colors',
        title: 'Colors'
      }
    },
    locale: 'tw',
    translate
  })

  assert.equal(page.url, '/tw/guide/colors')
  assert.equal(page.title, '色彩')
  assert.equal(page.description, '選擇色階。')
  assert.equal(page.category, '設計基礎')
  assert.deepEqual(page.nodes, [
    { id: 'default-palette', tag: 'h2', text: 'Default palette' },
    { tag: 'p', text: 'Use bg:blue.' }
  ])
})

test('createLocalizedPathname keeps default locale unprefixed', () => {
  assert.equal(createLocalizedPathname('/guide', 'en', 'en'), '/guide')
  assert.equal(createLocalizedPathname('guide', 'tw', 'en'), '/tw/guide')
})
