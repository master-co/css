import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'descendant-depth',
  render(theme: Theme) {
    const { text, label, at, finish } = study('descendant-depth', theme)
    const tree = (deep: boolean) => `${label('article · class owner', 'code')}<div class="dom-tree"><div class="dom-node target">${label('a · Link A', 'body')}</div><div class="dom-node">${label('section', 'code')}<div class="dom-tree"><div class="dom-node ${deep ? 'target' : ''}">${label('a · Link B', 'body')}</div></div></div></div>`
    return finish(`
      ${text(360, 76, 'Same DOM · different reach', 'eyebrow', 'center')}
      ${text(202, 145, 'underline>a', 'code', 'center')}
      ${text(518, 145, 'underline_a', 'code', 'center')}
      ${at(102, 202, tree(false))}
      ${at(418, 202, tree(true))}
      ${text(202, 393, 'Direct children', 'note', 'center')}
      ${text(518, 393, 'Descendants at any depth', 'note', 'center')}
    `)
  }
}
