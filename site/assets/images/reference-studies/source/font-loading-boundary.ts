import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'font-loading-boundary',
  render(theme: Theme) {
    const { text, at, route, finish } = study('font-loading-boundary', theme)
    route('M360 132V176H200V212')
    route('M360 176H520V212')
    return finish(`
      ${text(360, 68, 'A preference list is not a font download', 'eyebrow', 'center')}
      ${text(360, 110, 'font-family: "Geist", serif', 'code', 'center')}
      ${text(200, 230, 'Requested face available', 'note', 'center')}
      ${text(520, 230, 'Requested face unavailable', 'note', 'center')}
      ${at(200, 282, '<span data-label style="font:400 26px/36px Geist">Aa — Read clearly</span>', 'centered')}
      ${at(520, 282, '<span data-label style="font:400 26px/36px serif">Aa — Read clearly</span>', 'centered')}
      ${text(200, 346, 'Geist face', 'code', 'center')}
      ${text(520, 346, 'Serif fallback', 'code', 'center')}
      ${text(360, 418, 'Availability and glyph coverage determine the rendered face', 'edge', 'center')}
    `)
  }
}
