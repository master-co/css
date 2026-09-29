import { mkdir, readFile } from 'node:fs/promises'
import { writeIfChanged } from './write-if-changed'

const rawDir = new URL('../.generated/raw/', import.meta.url)
const sources = [
  ['fonts.css.txt', new URL('../public/fonts/index.css', import.meta.url)],
  ['base.css.txt', new URL('../../packages/preset/src/base.css', import.meta.url)],
  ['play-example.css.txt', new URL('../app/[locale]/play/templates/latest/example.css', import.meta.url)],
] as const

/** Give raw-loader text inputs a non-CSS extension so Next's CSS pipeline leaves them alone. */
export async function syncRawSources() {
  await mkdir(rawDir, { recursive: true })
  for (const [name, source] of sources) {
    await writeIfChanged(new URL(name, rawDir), await readFile(source, 'utf8'))
  }
}
