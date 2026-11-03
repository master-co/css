import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'source-relative-base',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('source-relative-base', theme)
    route('M326 302H400V382H292')
    return finish(`
      ${text(360, 60, 'The declaring stylesheet supplies the base directory', 'eyebrow', 'center')}
      ${at(108, 118, `${label('repository/', 'code')}<div class="detail-tree">
        <div>${label('apps/', 'code')}<div class="detail-tree"><div>${label('shop/', 'code')} ${label('← working directory', 'note')}</div></div></div>
        <div style="margin-top:28px">${label('styles/', 'code')}<div class="detail-tree">
          <div class="selected">${label('shared.css', 'code')}</div>
          <div>${label('views/', 'code')}<div class="detail-tree"><div class="detail-kept">${label('card.html', 'code')}</div></div></div>
        </div></div></div>`)}
      ${text(432, 292, '@source "./views/*.html";', 'code')}
      ${text(432, 322, 'Declared inside shared.css', 'note')}
      ${text(432, 372, 'Selects styles/views/', 'title')}
      ${text(360, 424, 'Importing shared.css does not move the pattern’s base', 'edge', 'center')}
    `)
  }
}
