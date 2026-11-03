import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'preload-is-data',
  render(theme: Theme) {
    const { text, label, at, lines, route, finish } = study('preload-is-data', theme)
    route('M288 160H418')
    route('M512 224V284')
    route('M288 308H418')
    route('M512 334V386')
    return finish(`
      ${text(360, 58, 'Runtime-only page · fetch first, use at startup', 'eyebrow', 'center')}
      ${at(92, 122, lines(['rel="preload"', 'as="fetch" crossorigin']))}
      ${text(352, 130, 'Fetch', 'note', 'center')}
      ${at(432, 122, `<div class="detail-boundary">${label('Program bytes', 'title')}<div style="margin-top:8px">${label('Fetched response', 'note')}</div></div>`)}
      ${text(536, 232, 'Consumed at startup', 'edge')}
      ${at(92, 286, lines(['Connected DOM', 'class usage'], 'note'))}
      ${at(432, 292, `<div class="branch-label">${label('Runtime initialization', 'title')}</div>`)}
      ${text(512, 400, 'Generated CSS rules', 'code', 'center')}
      ${text(208, 394, 'The preload hint does not execute CSS generation', 'edge', 'center')}
    `)
  }
}
