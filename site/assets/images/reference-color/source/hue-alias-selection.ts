import { generatePresetCSS } from '@master/internal-site/css/generate-preset-css.ts'
import { referenceIllustrations } from '../../../../reference/illustrations'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Same step positions expose different alias targets. Actual preset classes paint
// the swatches; outlines and leaders identify references, not generated borders.
export default {
  id: 'hue-alias-selection',
  render(theme: Theme) {
    const { text, codeParts, colorScale, leader, scene } = drawing(theme)
    const figure = referenceIllustrations['hue-alias-selection']
    const l = figure.labels
    const css = generatePresetCSS(l.hues.flatMap(hue => l.steps.map(step => `bg-${hue}-${step}`)))
    return scene(figure.title, figure.alt, `
      <style>${css}</style>
      ${text(360, 48, l.heading, 'note', 'center')}
      ${l.hues.map((hue, i) => {
        const y = 104 + i * 170
        const tone = i ? 'amber' : 'blue'
        return `
          ${codeParts(160, y, [{ value: l.prefixes[i] }, { id: `${hue}-alias`, value: hue, tone }])}
          ${text(480, y + 4, l.variables[i], 'code', 'center')}
          ${leader(`${hue}-alias`, `${hue}-selected`, y + 54, tone)}
          ${colorScale(360, y + 72, hue, l.steps, l.selected[i], tone)}
        `
      }).join('')}
      ${text(360, 442, l.scope, 'edge', 'center')}
    `)
  }
}
