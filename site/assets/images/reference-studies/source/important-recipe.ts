import { study } from './materials'
import type { Theme } from '@master/internal-site/demo/illustration-materials.ts'

export default {
  id: 'important-recipe',
  render(theme: Theme) {
    const { text, label, at, route, finish } = study('important-recipe', theme)
    route('M360 148V181H620V309', { arrow: false })
    for (const y of [229, 269, 309]) route(`M620 ${y}H580`)
    return finish(`
      ${text(360, 105, 'text-sm!', 'code', 'center')}
      ${at(120, 217, `<div class="stack">${['font-size: …', 'line-height: …', 'letter-spacing: …'].map(property => label(property, 'code')).join('')}</div>`)}
      ${at(470, 217, `<div class="stack important">${[0, 1, 2].map(() => label('!important', 'code')).join('')}</div>`)}
      ${text(360, 372, 'All three declarations are important', 'title', 'center')}
      ${text(360, 410, 'Theme token definitions keep their own importance', 'note', 'center')}
    `)
  }
}
