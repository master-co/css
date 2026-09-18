import { readStylesheetText } from './helpers/stylesheet-output'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import loader from '../src/stylesheet-loader'

const require = createRequire(new URL('../../vite/package.json', import.meta.url))
const sassFile = createRequire(require.resolve('vite')).resolve('sass')
async function fixture(run: (root: string) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), 'next-raw-sass-'))
  try {
    mkdirSync(join(root, 'parts'));mkdirSync(join(root, 'node_modules'))
    symlinkSync(dirname(sassFile), join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, 'master.css'), '@master entry;')
    await run(root)
  } finally { rmSync(root, { recursive: true, force: true }) }
}
function compile(root: string, file: string, source: string, dependencies: string[], sassOptions?: Record<string, unknown>) {
  return new Promise<string>((resolve, reject) => loader.call({
    resourcePath: file, rootContext: root, getOptions: () => ({ sassOptions }), addDependency: file => dependencies.push(file),
    async: () => (error: Error | null, output?: string) => error ? reject(error) : resolve(readStylesheetText(file, output!))
  }, source))
}
for (const syntax of ['scss', 'sass']) test(`Next ${syntax} additionalData keeps root diagnostic line`, async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.' + syntax)
    const source = syntax === 'sass' ? '/* authored */\n.card\n  @compose "block"\n' : '/* authored */\n.card { @compose "block"; }'
    const additionalData = syntax === 'sass' ? '$space: 2rem\n$other: 3rem' : '$space:2rem;\n$other:3rem;'
    await expect(compile(root, file, source, [], { implementation: sassFile, additionalData })).rejects.toMatchObject({
      diagnostics: [expect.objectContaining({ source: file, range: { start: expect.objectContaining({ line: syntax === 'sass' ? 2 : 1 }), end: expect.objectContaining({ line: syntax === 'sass' ? 2 : 1 }) } })]
    })
  })
})
test('Next additionalData does not shift imported partial diagnostics', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss'), partial = join(root, 'parts/_rules.scss')
    writeFileSync(partial, '/* partial */\n.card{@compose "block";}')
    await expect(compile(root, file, '@use "parts/rules";', [], { implementation: sassFile, additionalData: '$a:1;\n$b:2;' })).rejects.toMatchObject({
      diagnostics: [expect.objectContaining({ source: partial, range: { start: expect.objectContaining({ line: 1 }), end: expect.objectContaining({ line: 1 }) } })]
    })
  })
})
for (const syntax of ['scss', 'sass']) test(`Next ${syntax} reports Sass errors against authored root after injection`, async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.' + syntax)
    const source = syntax === 'sass' ? '/* authored */\n.card\n  padding: $missing\n' : '/* authored */\n.card { padding: $missing; }'
    const additionalData = syntax === 'sass' ? '$a: 1\r\n$b: 2' : '$a:1;\r\n$b:2;'
    await expect(compile(root, file, source, [], { implementation: sassFile, additionalData })).rejects.toMatchObject({
      span: { start: { line: syntax === 'sass' ? 2 : 1 }, text: '$missing' }, message: expect.stringContaining(`${file}:${syntax === 'sass' ? 3 : 2}:`)
    })
  })
})
test('Next labels compiler errors in injected Sass as injected content', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss')
    await expect(compile(root, file, '.card{padding:1rem}', [], { implementation: sassFile, additionalData: '.injected{@compose "block";}' })).rejects.toMatchObject({
      diagnostics: [expect.objectContaining({ source: expect.stringContaining('card.module.scss?master-css-additional-data'), range: { start: expect.objectContaining({ line: 0 }), end: expect.objectContaining({ line: 0 }) } })]
    })
  })
})
test('Next labels Sass errors in injected content without negative locations', async () => {
  await fixture(async root => {
    await expect(compile(root, join(root, 'card.module.scss'), '.card{padding:1rem}', [], { implementation: sassFile, additionalData: '.injected{padding:$missing}' })).rejects.toMatchObject({
      span: { start: { line: 0 }, text: '$missing' }, message: expect.stringContaining('?master-css-additional-data:1:')
    })
  })
})
for (const syntax of ['scss', 'sass']) test(`Next ${syntax} entry preserves imported partial reference ownership`, async () => {
  await fixture(async root => {
    const file = join(root, 'entry.' + syntax), partial = join(root, 'parts/_entry.scss')
    writeFileSync(partial, '@reference "./tokens.css";.card{@compose paint;}')
    writeFileSync(join(root, 'parts/tokens.css'), '@utilities{paint{padding:2rem}}')
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint{padding:99rem}}')
    const source = syntax === 'sass' ? '@use "parts/entry"\n@master entry\n' : '@use "parts/entry";@master entry;'
    const result = await compile(root, file, source, [], { implementation: sassFile })
    expect(result).toContain('padding:2rem')
    expect(result).not.toContain('99rem')
  })
})
