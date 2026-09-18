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
    async: () => (error: Error | null, output?: string) => error ? reject(error) : resolve(output!)
  }, source))
}
for (const syntax of ['scss', 'sass']) test(`Next raw ${syntax} retains partial reference and edit dependencies`, async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.' + syntax), partial = join(root, 'parts/_rules.scss'), token = join(root, 'parts/tokens.css')
    writeFileSync(partial, '@reference "./tokens.css";.card{@compose paint;}')
    writeFileSync(token, '@utilities{paint{padding:2rem}}')
    writeFileSync(join(root, 'tokens.css'), '@utilities{paint{padding:99rem}}')
    const source = syntax === 'sass' ? '@use "parts/rules"\n' : '@use "parts/rules";', dependencies: string[] = []
    expect(await compile(root, file, source, dependencies)).toContain('padding:2rem')
    expect(dependencies).toEqual(expect.arrayContaining([file, partial, token]))
    writeFileSync(token, '@utilities{paint{padding:4rem}}')
    expect(await compile(root, file, source, [])).toContain('padding:4rem')
  })
})
test('Next raw Sass uses configured implementation, load paths and additional data', async () => {
  await fixture(async root => {
    writeFileSync(join(root, 'parts/_tokens.scss'), '$space:3rem;')
    const css = await compile(root, join(root, 'card.module.scss'), '@use "tokens";@reference "./master.css";.card{@compose p:#{tokens.$space};margin:$extra}', [], {
      implementation: sassFile, loadPaths: [join(root, 'parts')], additionalData: '$extra:4rem;', style: 'compressed'
    })
    expect(css).toContain('padding:3rem')
    expect(css).toMatch(/margin:\s*4rem/)
  })
})
test('Next registers missing mapped CSS reference before error and recovers on creation', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss'), missing = join(root, 'parts/missing.css'), dependencies: string[] = []
    writeFileSync(join(root, 'parts/_rules.scss'), '@reference "./missing.css";.card{@compose paint;}')
    await expect(compile(root, file, '@use "parts/rules";', dependencies)).rejects.toThrow()
    expect(dependencies).toContain(missing)
    writeFileSync(missing, '@utilities{paint{padding:5rem}}')
    expect(await compile(root, file, '@use "parts/rules";', [])).toContain('padding:5rem')
  })
})
test('Next reports invalid compose in the original Sass partial', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss'), partial = join(root, 'parts/_rules.scss')
    writeFileSync(partial, '/* original */\n.card{@compose "block";}')
    await expect(compile(root, file, '@use "parts/rules";', [])).rejects.toMatchObject({ diagnostics: [expect.objectContaining({ source: partial, range: { start: expect.objectContaining({ line: 1 }), end: expect.objectContaining({ line: 1 }) } })] })
  })
})
test('Next watches a Sass partial that throws before loadedUrls are returned', async () => {
  await fixture(async root => {
    const file = join(root, 'card.module.scss'), partial = join(root, 'parts/_rules.scss'), dependencies: string[] = []
    writeFileSync(partial, '.card{padding:$missing}')
    await expect(compile(root, file, '@use "parts/rules";', dependencies)).rejects.toThrow('Undefined variable')
    expect(dependencies).toContain(partial)
    writeFileSync(partial, '.card{padding:2rem}')
    expect(await compile(root, file, '@use "parts/rules";', [])).toMatch(/padding:\s*2rem/)
  })
})
