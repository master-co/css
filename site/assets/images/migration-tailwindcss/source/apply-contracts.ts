import { tailwindIllustration as figure } from '../../../../content/guide/migration/tailwindcss/illustration'
import { drawing, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Syntax anatomy highlights only the argument whose contract changes.
export default {
  id: 'apply-contracts',
  render(theme: Theme) {
    const { scene, text, codeParts, annotation, leader } = drawing(theme)
    const l = figure.labels
    return scene(figure.title, figure.alt, `
      <style>
        .code-part > .code { white-space:pre; }
        .code-part:has([data-anchor$="-keyword"], [data-anchor$="-end"]) { background:none;--annotation-ink:var(--ui-text-muted); }
        .code-part:has([data-anchor$="-keyword"], [data-anchor$="-end"]) .code-bracket { visibility:hidden; }
      </style>
      ${text(64, 98, l.tailwind, 'note')}
      ${codeParts(430, 92, [
        { id: 'tailwind-keyword', value: l.firstKeyword, tone: 'blue' },
        { id: 'utilities', value: l.utilities, tone: 'blue' },
        { id: 'tailwind-end', value: l.firstEnd, tone: 'blue' }
      ])}
      ${annotation(430, 174, 'utility-input', l.utilityTitle, l.utilityDetail, 'blue')}
      ${leader('utilities', 'utility-input', 153, 'blue')}
      ${text(64, 298, l.master, 'note')}
      ${codeParts(430, 292, [
        { id: 'master-keyword', value: l.secondKeyword, tone: 'violet' },
        { id: 'mixin', value: l.mixin, tone: 'violet' },
        { id: 'master-end', value: l.secondEnd, tone: 'violet' }
      ])}
      ${annotation(430, 374, 'mixin-input', l.mixinTitle, l.mixinDetail, 'violet')}
      ${leader('mixin', 'mixin-input', 353, 'violet')}
    `)
  }
}
