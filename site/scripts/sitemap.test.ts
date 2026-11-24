import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { finalizeSeo } from './static-seo'
import { renderSitemap } from './sitemap'

test('sitemap bytes do not depend on the order in which pages and locales were discovered', () => {
    const groups = new Map([
        ['/z', new Map([['ja', 'https://css.master.co/ja/z'], ['en', 'https://css.master.co/z']])],
        ['/a', new Map([['tw', 'https://css.master.co/tw/a?x=1&y=2']])]
    ])
    const reversed = new Map([...groups].reverse().map(([key, variants]) => [key, new Map([...variants].reverse())]))
    const xml = renderSitemap(groups)

    assert.equal(renderSitemap(reversed), xml)
    assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]), [
        'https://css.master.co/tw/a?x=1&amp;y=2', 'https://css.master.co/z', 'https://css.master.co/ja/z'
    ])
    assert.equal(xml.match(/hreflang="x-default" href="https:\/\/css\.master\.co\/z"/g)?.length, 2)
    assert.ok(!xml.includes('hreflang="zh-TW"'))
})

test('static SEO only links published ancestors and keeps repeated finalization stable', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'master-sitemap-'))
    const origin = 'https://example.test'
    const files: string[] = []
    const write = async (name: string, body: string) => {
        const file = path.join(dir, name)
        await mkdir(path.dirname(file), { recursive: true })
        await writeFile(file, body)
        files.push(file)
        return file
    }
    const head = (links: string) => `<html><head>${links}</head><body></body></html>`
    const canonical = (route: string) => `<link href='${origin}${route}' rel='canonical'>`
    try {
        await write('tw.html', head(canonical('/tw')))
        await write('tw/llms.txt', '# Master CSS')
        await write('tw/reference.html', head(canonical('/tw/reference')))
        await write('tw/reference.md', '# 參考文件\n')
        const leaf = await write('tw/reference/tools/mcp.html', head(canonical('/tw/reference/tools/mcp')))
        await write('tw/reference/tools/mcp.md', '# MCP <tools>\n')
        await write('tw/404.html', head('<meta content="noindex" name="robots">'))
        await finalizeSeo(dir, origin, files)
        const built = await readFile(leaf, 'utf8')
        assert.ok(built.includes('type="text/markdown" href="https://example.test/tw/reference/tools/mcp.md"'))
        assert.ok(built.includes('rel="describedby" href="https://example.test/tw/llms.txt"'))
        const data = JSON.parse(built.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1])
        assert.deepEqual(data.itemListElement.map((item: { item: string; name: string }) => [item.item, item.name]), [
            [origin + '/tw', 'Master CSS'], [origin + '/tw/reference', '參考文件'], [origin + '/tw/reference/tools/mcp', 'MCP <tools>']
        ])
        assert.ok(!built.includes('MCP <tools>'))
        await finalizeSeo(dir, origin, files)
        assert.equal(await readFile(leaf, 'utf8'), built)
        await writeFile(leaf, built.replace('<head>', '<head><meta name="robots" content="noindex">'))
        await finalizeSeo(dir, origin, files)
        assert.ok(!(await readFile(leaf, 'utf8')).includes('rel="describedby"'))
        assert.ok(!(await readFile(path.join(dir, 'sitemap.xml'), 'utf8')).includes('/tools/mcp'))
        assert.ok(!(await readFile(path.join(dir, 'tw.html'), 'utf8')).includes('text/markdown'))
        assert.ok(!(await readFile(path.join(dir, 'sitemap.xml'), 'utf8')).includes('404'))
        const duplicate = await write('tw/index.html', head(canonical('/tw')))
        await assert.rejects(finalizeSeo(dir, origin, files), /Duplicate canonical.*\/tw/)
        files.splice(files.indexOf(duplicate), 1)
        for (const invalid of ['', canonical('/tw') + canonical('/tw'), canonical('/en'), '<link rel="canonical" href="https://other.test/tw">']) {
            await writeFile(path.join(dir, 'tw.html'), head(invalid))
            await assert.rejects(finalizeSeo(dir, origin, files), /tw.html: expected one canonical/)
        }
    } finally {
        await rm(dir, { recursive: true, force: true })
    }
})
