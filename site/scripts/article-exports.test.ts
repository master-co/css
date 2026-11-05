import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadPages } from './generate-llms-txt'
import { writeArticleMarkdownExports } from './article-exports'
import { localizedGuideCategories } from '../utils/localized-content'

test('publishing, drafting and removing an article reconcile exports without deleting assets or other languages', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'master-article-exports-'))
  try {
    const site = path.join(root, 'site')
    const directory = path.join(site, 'content/guide/private-regression')
    const publicDir = path.join(site, 'public')
    await mkdir(directory, { recursive: true })
    const source = path.join(directory, 'content.mdx')
    const translated = path.join(directory, 'content.tw.mdx')
    await writeFile(source, '## Published {#published}\n\nPublic explanation.\n')
    await writeFile(translated, '---\ntitle: 公開文章\ndescription: 公開摘要\n---\n## 已公開 {#published}\n\n公開說明。\n')
    const categories = [{ name: 'Authoring', pages: [{ title: 'Published', pathname: '/guide/private-regression', sourcePath: 'site/content/guide/private-regression/content.mdx' }] }]
    const load = (locale: string) => loadPages(path.join(site, 'content'), locale)
    const write = async (locale: string) => writeArticleMarkdownExports(publicDir, await load(locale), locale)
    await write('en')
    await write('tw')
    const englishOutput = path.join(publicDir, 'guide/private-regression.md')
    const translatedOutput = path.join(publicDir, 'tw/guide/private-regression.md')
    assert.match(await readFile(translatedOutput, 'utf8'), /公開說明/)
    const asset = path.join(publicDir, 'guide/illustration.svg')
    const unrelated = path.join(publicDir, 'keep.md')
    await writeFile(asset, '<svg/>')
    await writeFile(unrelated, 'Maintained separately')

    await writeFile(translated, '---\ndraft: true\ntitle: 私人譯稿\n---\nPrivate translation.\n')
    assert.equal((await load('en')).length, 1)
    assert.deepEqual(await load('tw'), [])
    assert.deepEqual((await localizedGuideCategories(site, categories, 'tw'))[0].pages, [])
    await write('tw')
    await assert.rejects(readFile(translatedOutput), { code: 'ENOENT' })
    assert.match(await readFile(englishOutput, 'utf8'), /Public explanation/)

    await writeFile(source, '---\ndraft: true\n---\nPrivate source.\n')
    await rm(translated)
    // A source draft never needs a translation and disappears in every language.
    assert.deepEqual(await load('en'), [])
    assert.deepEqual(await load('tw'), [])
    assert.deepEqual((await localizedGuideCategories(site, categories, 'en'))[0].pages, [])
    await write('en')
    await write('tw')
    await assert.rejects(readFile(englishOutput), { code: 'ENOENT' })

    // Removal also clears a previous generated Markdown file on the next run.
    await writeFile(source, 'Public explanation again.\n')
    await write('en')
    await rm(directory, { recursive: true })
    await write('en')
    await assert.rejects(readFile(englishOutput), { code: 'ENOENT' })
    assert.equal(await readFile(asset, 'utf8'), '<svg/>')
    assert.equal(await readFile(unrelated, 'utf8'), 'Maintained separately')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
