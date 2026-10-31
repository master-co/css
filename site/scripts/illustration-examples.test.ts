import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { deliveryFlow, deliveryFlowDescription, deliveryIllustrations } from '../utils/delivery-flows'

const directory = new URL('../assets/images/rendering-modes/', import.meta.url)
const decode = (value: string) => value.replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[name]!)

test('published delivery illustrations retain the shared labels and conditions in both themes', async () => {
  for (const name of ['runtime', 'progressive', 'hydration', 'pruning', 'route', 'nextjs'] as const) {
    const expectedLabels = Object.values(deliveryIllustrations[name].labels).sort()
    for (const theme of ['light', 'dark']) {
      const stem = `${name}-${theme}`
      const svg = await readFile(new URL(`${stem}.svg`, directory), 'utf8')
      assert.equal(decode(svg.match(/<title[^>]*>(.*?)<\/title>/s)![1]), deliveryFlow(name).title, stem)
      assert.equal(decode(svg.match(/<desc[^>]*>(.*?)<\/desc>/s)![1]), deliveryFlowDescription(name), `${stem}: stale technical description`)
      const labels = [...svg.matchAll(/<text\b[^>]*>(.*?)<\/text>/gs)].map(match => decode(match[1])).sort()
      assert.deepEqual(labels, expectedLabels, `${stem}: missing, duplicated, or stale figure labels`)

      const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/)!
      if (['runtime', 'progressive', 'hydration'].includes(name)) {
        assert.equal(Number(w) * 2, Number(h) * 3, `${stem}: rendering modes must use a landscape 3:2 canvas`)
      }
      const png = await readFile(new URL(`${stem}.png`, directory))
      assert.equal(png.subarray(1, 4).toString(), 'PNG', stem)
      assert.equal(png.readUInt32BE(16), Number(w) * 2, `${stem}: PNG width does not match the editable source`)
      assert.equal(png.readUInt32BE(20), Number(h) * 2, `${stem}: PNG height does not match the editable source`)
    }
  }
})
