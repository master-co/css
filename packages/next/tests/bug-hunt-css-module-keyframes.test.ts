import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import { prepareNextModule } from '../src/prepare-module'
import loader from '../src/stylesheet-loader'

test('native keyframes in CSS Modules stay verbatim and pass Next purity', async () => {
  const root = mkdtempSync(join(tmpdir(), 'master-css-next-keyframe-module-'))
  try {
    mkdirSync(join(root, 'app'))
    writeFileSync(join(root, 'app/globals.css'), '@import "@master/css";')
    const file = join(root, 'app/card.module.css')
    const source = '.card{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(1turn)}}'
    writeFileSync(file, source)
    const code = await new Promise<string>((done, reject) => loader.call({
      resourcePath: file, rootContext: root, getOptions: () => ({}), addDependency() {}, addContextDependency() {},
      async: () => (error: Error | null, output?: string) => error ? reject(error) : done(output!)
    }, source))

    expect(code).toContain('@keyframes spin{to{transform:rotate(1turn)}}')
    expect(code).not.toMatch(/master-css-(keyframe|slot)|__master_css_slot/)
    const processed = await prepareNextModule({ resourcePath: file, rootContext: root }, code, root)
    expect(processed.source).toContain('@keyframes card_spin__')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
