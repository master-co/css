import { generatePresetCSS } from '../../../../common/generate-preset-css'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

export default {
  id: 'truncation-lines',
  render(theme: Theme) {
    const { text, scene } = drawing(theme)
    const figure = referenceIllustrations['truncation-lines']
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>${generatePresetCSS(['truncate', 'clamp-lines(2)'])}
        .clipping-copy { width:192px; font-size:14px; line-height:24px; color:var(--ui-text-strong); background:color-mix(in oklch,var(--ui-tone-blue) 6%,transparent); }
      </style>
      ${l.headings.map((heading, i) => text(48 + i * 216, 124, heading, 'code')).join('')}
      ${['', 'truncate', 'clamp-lines(2)'].map((name, i) => `<div class="clipping-copy ${name}" style="left:${48 + i * 216}px;top:180px">${l.content}</div>`).join('')}
      ${text(360, 424, l.scope, 'edge', 'center')}
    `)
  }
}
