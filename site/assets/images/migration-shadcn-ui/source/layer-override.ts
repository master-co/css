import { shadcnIllustration as figure } from '../../../../content/guide/migration/shadcn-ui/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Reader question: which padding applies when a caller adjusts a converted component?
// One element carries both selectors; each attaches to its own layer, and the arrow
// points toward the later layer instead of implying that a class was removed.
export default {
  id: 'layer-override',
  render(theme: Theme) {
    const { scene, text, codeParts, annotation, leader, route } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .code-part > .code { white-space:pre; }
        .code-part:has([data-anchor$="-keyword"], [data-anchor$="-end"]) { background:none;--annotation-ink:var(--ui-text-muted); }
        .code-part:has([data-anchor$="-keyword"], [data-anchor$="-end"]) .code-bracket { visibility:hidden; }
      </style>
      ${codeParts(360, 118, [
        { id: 'markup-keyword', value: l.markupKeyword, tone: 'blue' },
        { id: 'slot', value: l.slot, tone: 'blue' },
        { id: 'class-keyword', value: l.classKeyword, tone: 'blue' },
        { id: 'utility', value: l.utility, tone: 'violet' },
        { id: 'markup-end', value: l.markupEnd, tone: 'violet' }
      ])}
      ${annotation(200, 232, 'component-layer', l.componentTitle, l.componentDetail, 'blue')}
      ${leader('slot', 'component-layer', 196, 'blue')}
      ${annotation(520, 232, 'utility-layer', l.utilityTitle, l.utilityDetail, 'violet')}
      ${leader('utility', 'utility-layer', 196, 'violet')}
      ${route('M318 244H402', { emphasis: true })}
      ${text(360, 256, l.order, 'edge', 'center')}
      ${text(360, 340, l.result, 'body', 'center')}
    `)
  }
}
