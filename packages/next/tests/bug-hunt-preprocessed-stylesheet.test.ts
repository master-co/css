import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import loader from '../src/stylesheet-loader'

const viteRequire = createRequire(new URL('../../vite/package.json', import.meta.url))
const sassDir = dirname(createRequire(viteRequire.resolve('vite')).resolve('sass'))

for (const preprocessed of [false, true]) test(`Next preserves the host Sass preprocessing boundary, preprocessed=${preprocessed}`, async () => {
  const root = mkdtempSync(join(tmpdir(), 'next-preprocessed-sass-'))
  try {
    mkdirSync(join(root, 'node_modules'));symlinkSync(sassDir, join(root, 'node_modules/sass'), 'dir')
    writeFileSync(join(root, 'master.css'), '@master entry;')
    const resourcePath = join(root, preprocessed ? 'card.module.sass' : 'card.module.scss')
    const raw = preprocessed
      ? '@reference "./master.css"\n.card\n  @compose p:2rem\n'
      : '@reference "./master.css"; $padding:2rem; .card { @compose p:#{$padding}; }'
    writeFileSync(resourcePath, raw)
    const source = preprocessed ? '@reference "./master.css";\n.card { @compose p:2rem; }' : raw
    const css = await new Promise<string>((resolve, reject) => loader.call({
      resourcePath, rootContext: root,
      getOptions: () => ({ preprocessed }),
      async: () => (error: Error | null, result?: string) => error ? reject(error) : resolve(result!)
    }, source))
    expect(css).toContain('padding:2rem')
    expect(css).not.toContain('@compose')
  } finally { rmSync(root, { recursive: true, force: true }) }
})
