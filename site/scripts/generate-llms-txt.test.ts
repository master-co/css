import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    cleanMdx,
    deriveTitle,
    metadataTitle,
    normalizeRoutePath,
    pageUrl,
    topSection,
    renderLlmsIndex,
    renderLlmsFull,
    type Page
} from './generate-llms-txt.ts'

const fixture: Page[] = [
    {
        file: '/x/guide/content.mdx',
        section: 'guide',
        url: '/en/guide',
        title: 'Guide',
        description: 'Start using Master CSS.',
        body: '## Getting Started\nIntro.'
    },
    {
        file: '/x/guide/colors/content.mdx',
        section: 'guide',
        url: '/en/guide/colors',
        title: 'Colors',
        description: 'Create color tokens.',
        body: '# Colors\nColor system overview.'
    },
    {
        file: '/x/reference/content.mdx',
        section: 'reference',
        url: '/en/reference',
        title: 'Reference',
        description: 'API reference.',
        body: '# Reference\nAPI reference.'
    }
]

test('deriveTitle prefers the first heading over the route segment', () => {
    assert.equal(deriveTitle('# Hello World\nrest', 'fallback'), 'Hello World')
    assert.equal(deriveTitle('## Subhead\nbody', 'fallback'), 'Subhead')
})

test('deriveTitle strips trailing [sr-only] / {.cls} markers from MDX headings', () => {
    assert.equal(deriveTitle('## Overview [sr-only]\nbody', 'fallback'), 'Overview')
    assert.equal(deriveTitle('## Overview {.sr-only}\nbody', 'fallback'), 'Overview')
})

test('deriveTitle falls back to titleized last segment when no heading', () => {
    assert.equal(deriveTitle('no headings here', 'static-extraction'), 'Static Extraction')
})

test('pageUrl strips content.mdx and prefixes locale', () => {
    assert.equal(pageUrl('guide/colors/content.mdx'), '/en/guide/colors')
    assert.equal(pageUrl('guide/content.mdx', 'tw'), '/tw/guide')
})

test('pageUrl strips Next.js route groups', () => {
    assert.equal(normalizeRoutePath('guide/installation/(main)/cdn/content.mdx'), 'guide/installation/cdn')
    assert.equal(pageUrl('guide/installation/(main)/content.mdx'), '/en/guide/installation')
    assert.equal(pageUrl('guide/installation/(main)/cdn/content.mdx'), '/en/guide/installation/cdn')
})

test('topSection extracts the first segment', () => {
    assert.equal(topSection('guide/colors/content.mdx'), 'guide')
    assert.equal(topSection('guide/installation/(main)/cdn/content.mdx'), 'guide')
    assert.equal(topSection('reference/content.mdx'), 'reference')
})

test('metadataTitle reads string and absolute metadata titles', () => {
    assert.equal(metadataTitle('Colors'), 'Colors')
    assert.equal(metadataTitle({ absolute: 'Installing Master CSS' }), 'Installing Master CSS')
    assert.equal(metadataTitle({ default: 'Master CSS' }), 'Master CSS')
})

test('cleanMdx removes MDX-only syntax outside fenced code', () => {
    const out = cleanMdx([
        "import Demo from './Demo'",
        '',
        '## Overview [sr-only]',
        '<Demo className="x">',
        '    <div className="demo">visual-only</div>',
        '    <summary>Generated CSS</summary>',
        "{require('./fixture.css?raw')}",
        'Content <Badge /> text.',
        '</Demo>',
        '',
        '```tsx',
        "import React from 'react'",
        '<Demo />',
        '```'
    ].join('\n'))
    assert.match(out, /## Overview\n/)
    assert.match(out, /Content\s+text\./)
    assert.doesNotMatch(out, /^import Demo/m)
    assert.doesNotMatch(out, /require\(/)
    assert.doesNotMatch(out, /Generated CSS/)
    assert.doesNotMatch(out, /<Badge/)
    assert.match(out, /import React from 'react'/)
    assert.match(out, /<Demo \/>/)
})

test('renderLlmsIndex emits H1 + summary + per-section H2 with links', () => {
    const out = renderLlmsIndex(fixture, 'https://example.test')
    assert.match(out, /^# Master CSS\n/)
    assert.match(out, /\n> .+\n/)
    assert.match(out, /\n## Guide\n/)
    assert.match(out, /\n## Reference\n/)
    assert.match(out, /- \[Guide\]\(https:\/\/example\.test\/en\/guide\): Start using Master CSS\./)
    assert.match(out, /- \[Colors\]\(https:\/\/example\.test\/en\/guide\/colors\): Create color tokens\./)
    assert.match(out, /- \[Reference\]\(https:\/\/example\.test\/en\/reference\): API reference\./)
})

test('renderLlmsIndex sorts sections alphabetically and pages by url', () => {
    const out = renderLlmsIndex(fixture)
    const guideIdx = out.indexOf('## Guide')
    const refIdx = out.indexOf('## Reference')
    assert.ok(guideIdx > 0 && refIdx > guideIdx)
    const colorsIdx = out.indexOf('Colors')
    const guideTopIdx = out.indexOf('](https://rc.css.master.co/en/guide)')
    assert.ok(guideTopIdx > 0 && guideTopIdx < colorsIdx)
})

test('renderLlmsFull concatenates each page body with a Source line', () => {
    const out = renderLlmsFull(fixture, 'https://example.test')
    assert.match(out, /Source: https:\/\/example\.test\/en\/guide\b/)
    assert.match(out, /Summary: Start using Master CSS\./)
    assert.match(out, /Color system overview\./)
    assert.match(out, /API reference\./)
})
