import { transitionIllustration as figure } from '../../../../content/guide/view-transitions/illustration'
import { drawing, type Theme } from '../../rendering-modes/source/materials'

// The actual demo image retains identity while its bounds change. Contours mark captured images, not DOM identity.
export default {
  id: 'named-captures',
  render(theme: Theme) {
    const { scene, label, text, route } = drawing(theme)
    const l = figure.labels
    const photo = new URL('../article-aurora.jpg', import.meta.url).href
    const card = (name: string, size: number, content: string) => `
      <div class="capture-card ${name}" style="--photo-width:${size}px">
        <div class="capture-photo"><img src="${photo}" alt="" /><span class="capture-name">${label(l.name, 'code')}</span></div>
        <div>${label(l.title, 'title')}${content}</div>
      </div>`
    return scene(figure.title, figure.alt, `
      <style>
        .capture-card { width:max-content;border-radius:var(--ui-radius-xl);background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1); }
        .capture-card img { display:block;width:var(--photo-width);aspect-ratio:16/9;object-fit:cover;border-radius:var(--ui-radius-xl) var(--ui-radius-xl) 0 0;outline:1px solid var(--ui-tone-blue);outline-offset:3px; }
        .capture-photo { position:relative; }
        .capture-name { position:absolute;left:8px;top:8px;padding:3px 6px;border-radius:4px;background:var(--ui-surface-sheet);box-shadow:var(--ui-elevation-rise-1); }
        .capture-card > div:not(.capture-photo) { display:flex;flex-direction:column;gap:12px;padding:16px; }
        .capture-card.before { left:65px;top:152px; }
        .capture-card.after { left:370px;top:115px; }
      </style>
      ${text(65, 112, l.before, 'note')}${text(370, 75, l.after, 'note')}
      ${card('before', 200, label(l.more, 'note'))}
      ${card('after', 284, label(l.description, 'note'))}
      ${route('M281 209H351')}
      ${text(360, 391, l.property, 'code', 'center')}
      ${text(360, 420, l.match, 'note', 'center')}
    `)
  }
}
