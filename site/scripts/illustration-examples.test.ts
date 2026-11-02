import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../utils/delivery-flows'
import { sceneHeight, sceneWidth, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

const directory = new URL('../assets/images/rendering-modes/', import.meta.url)
const decode = (value: string) => value.replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[name]!)

test('published delivery illustrations retain the shared labels and conditions in both themes', async () => {
  assert.equal(sceneWidth * 2, sceneHeight * 3, 'rendering modes must use a landscape 3:2 canvas')
  for (const name of ['runtime', 'progressive', 'hydration', 'pruning', 'pruning-scope', 'route', 'nextjs', 'scanning'] as const) {
    const scene = (await import(`../assets/images/rendering-modes/source/${name}.ts`)).default as {
      id: string
      render(theme: Theme): { width: number, height: number, title: string, description: string, html: string }
    }
    assert.equal(scene.id, name)
    const expectedLabels = Object.values(deliveryIllustrations[name].labels).sort()
    for (const theme of ['light', 'dark'] as const) {
      const stem = `${name}-${theme}`
      const { width, height, title, description, html } = scene.render(theme)
      assert.equal(title, deliveryFlow(name).title, stem)
      assert.equal(description, deliveryFlowDescription(name), `${stem}: stale technical description`)
      const labels = [...html.matchAll(/<span [^>]*data-label>(.*?)<\/span>/gs)].map(match => decode(match[1])).sort()
      assert.deepEqual(labels, expectedLabels, `${stem}: missing, duplicated, or stale figure labels`)

      const png = await readFile(new URL(`${stem}.png`, directory))
      assert.equal(png.subarray(1, 4).toString(), 'PNG', stem)
      assert.equal(png.readUInt32BE(16), width * 2, `${stem}: PNG width does not match the scene`)
      assert.equal(png.readUInt32BE(20), height * 2, `${stem}: PNG height does not match the scene`)
    }
  }
})
