import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createStaticPaths, sectionOf } from './route-paths'

test('enumerates static filenames, groups and locales without loading content', async () => {
  const paths = await createStaticPaths(['/content/guide/(intro)/start/page.astro', '/content/page.astro', '/content/examples/demo/page.astro'], {})
  assert.deepEqual(paths.map(path => path.params.path), ['examples/demo', 'guide/start', 'tw/guide/start', undefined, 'tw'])
  assert.deepEqual(paths[1].props, { file: '/content/guide/(intro)/start/page.astro', locale: 'en', params: {} })
  assert.equal(sectionOf('/content/(home)/page.astro'), 'home')
})

test('loads only matching dynamic parameter providers and preserves their order', async () => {
  const paths = await createStaticPaths(['/content/reference/[entry]/page.astro', '/content/reference/[...entry]/page.astro', '/content/reference/tokens/[namespace]/page.astro'], {
    '/content/reference/[entry]/params.ts': async () => ({ generateStaticParams: () => [{ entry: 'p' }, { entry: 'm' }] }),
    '/content/reference/[...entry]/params.ts': async () => ({ generateStaticParams: async () => [{ entry: ['rules', 'declarations'] }] }),
    '/content/reference/tokens/[namespace]/params.ts': async () => ({ generateStaticParams: () => [{ namespace: 'color' }] }),
    '/content/unused/params.ts': async () => { throw new Error('Must not load unrelated providers') }
  })
  assert.deepEqual(paths.map(path => path.params.path), ['reference/rules/declarations', 'tw/reference/rules/declarations', 'reference/p', 'tw/reference/p', 'reference/m', 'tw/reference/m', 'reference/tokens/color', 'tw/reference/tokens/color'])
  assert.deepEqual(paths[0].props.params, { entry: ['rules', 'declarations'] })
})

test('rejects missing providers, missing parameters and index segments', async () => {
  await assert.rejects(createStaticPaths(['/content/reference/[entry]/page.astro'], {}), /sibling params.ts/)
  await assert.rejects(createStaticPaths(['/content/reference/[entry]/page.astro'], {
    '/content/reference/[entry]/params.ts': async () => ({ generateStaticParams: () => [{}] })
  }), /Missing route parameter entry/)
  await assert.rejects(createStaticPaths(['/content/guide/index/page.astro'], {}), /index.*not a valid route segment/)
})
