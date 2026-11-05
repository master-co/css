import { expect, test } from 'bun:test'
import { renderSitemap } from './sitemap'

test('sitemap bytes do not depend on the order in which pages and locales were discovered', () => {
    const groups = new Map([
        ['/z', new Map([['ja', 'https://css.master.co/ja/z'], ['en', 'https://css.master.co/z']])],
        ['/a', new Map([['tw', 'https://css.master.co/tw/a?x=1&y=2']])]
    ])
    const reversed = new Map([...groups].reverse().map(([key, variants]) => [key, new Map([...variants].reverse())]))
    const xml = renderSitemap(groups)

    expect(renderSitemap(reversed)).toBe(xml)
    expect([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1])).toEqual([
        'https://css.master.co/tw/a?x=1&amp;y=2', 'https://css.master.co/z', 'https://css.master.co/ja/z'
    ])
    expect(xml.match(/hreflang="x-default" href="https:\/\/css\.master\.co\/z"/g)).toHaveLength(2)
    expect(xml).not.toContain('hreflang="x-default" href="https://css.master.co/tw/')
})
