import { compatibilityIllustration } from '../../../../content/guide/compatibility/illustration'
import { drawing, escapeHtml, type Theme } from '@master/internal-site/demo/illustration-materials.ts'

// Reader question: what remains usable when the sizing enhancement is unavailable?
// Render real controls with identical content, width, type and limits; change only field-sizing.
// The fixed width isolates the comparison. Heights come from native textarea layout, not drawn guesses.
export default {
  id: 'field-fallback',
  render(theme: Theme) {
    const { text, route, scene } = drawing(theme)
    const l = compatibilityIllustration.labels
    const field = (x: number, enhanced: boolean) => `<textarea class="field" aria-label="${enhanced ? l.enhanced : l.fallback}" rows="3" style="left:${x}px;${enhanced ? 'field-sizing:content;' : ''}">${escapeHtml(l.note)}</textarea>`
    return scene(compatibilityIllustration.title, compatibilityIllustration.alt, `
      <style>
        .field {
          top: 234px; width: 240px; min-height: 96px; max-height: 192px; margin: 0; padding: var(--ui-space-sm);
          resize: vertical; overflow: auto; border: 1px solid var(--ui-line-divider); border-radius: var(--ui-radius-md);
          background: var(--ui-surface-well); color: var(--ui-text-strong); font: 400 14px/21px Geist, sans-serif;
        }
        .field::-webkit-scrollbar { width: 8px; }
        .field::-webkit-scrollbar-thumb { border: 2px solid var(--ui-surface-well); border-radius: 6px; background: var(--ui-line-strong); }
        .field::-webkit-scrollbar-track { background: var(--ui-surface-well); }
      </style>
      ${text(360, 88, l.query, 'code', 'center')}
      ${route('M360 120V150', { arrow: false })}
      ${route('M360 150H212Q204 150 204 158V186')}
      ${route('M360 150H508Q516 150 516 158V186')}
      ${text(204, 200, l.fallback, 'title', 'center')}
      ${text(516, 200, l.enhanced, 'title', 'center')}
      ${field(84, false)}
      ${field(396, true)}
      ${text(204, 410, l.fallbackNote, 'note', 'center')}
      ${text(516, 410, l.enhancedNote, 'note', 'center')}
    `)
  }
}
