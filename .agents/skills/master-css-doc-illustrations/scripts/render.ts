/** Render an authored scene with the site's existing resvg and local Geist fonts. */
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..')
const [sceneFile, destination] = process.argv.slice(2)
if (!sceneFile || !destination) {
  throw new Error('Usage: bun .agents/skills/master-css-doc-illustrations/scripts/render.ts <scene.ts> <output-directory>')
}
const scene = (await import(pathToFileURL(resolve(sceneFile)).href)).default as {
  id: string
  render(theme: 'light' | 'dark'): { width: number, height: number, svg: string }
}
if (!/^[a-z][a-z0-9-]*$/.test(scene.id)) throw new Error('Scene id must be a kebab-case filename stem')
const output = resolve(destination)
await mkdir(output, { recursive: true })

for (const theme of ['light', 'dark'] as const) {
  const { width, height, svg } = scene.render(theme)
  const stem = `${scene.id}-${theme}`
  const rendered = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
    font: {
      loadSystemFonts: false,
      fontFiles: [join(root, 'site/public/fonts/Geist-Regular.ttf'), join(root, 'site/public/fonts/Geist-Medium.ttf')],
      defaultFontFamily: 'Geist',
      sansSerifFamily: 'Geist'
    }
  }).render()
  if (rendered.width !== width * 2 || rendered.height !== height * 2) {
    throw new Error(`Unexpected output dimensions for ${stem}`)
  }
  await writeFile(join(output, `${stem}.svg`), svg)
  await writeFile(join(output, `${stem}.png`), rendered.asPng())
  console.log(`${stem}: ${rendered.width} × ${rendered.height}`)
}
