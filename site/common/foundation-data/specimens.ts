import { namespaceTokens, selectFoundationTokens } from './tokens'
import { getShadowRows } from './elevation/shadow-data'
import { escape } from '../../components/demo/reference/html'
import type { DemoScene } from '../../components/demo/reference/types'

export type FoundationToken = ReturnType<typeof namespaceTokens>[number]
export function specimenTokens(namespace: string, keys?: string[]) {
  return keys ? selectFoundationTokens(namespace, keys) : namespaceTokens(namespace)
}
export const defaultValue = (token: FoundationToken) => token.values.find(value => value.path.length === 1 && value.path[0] === ':root,:host')?.value ?? token.values[0]?.value ?? ''
export const primaryTokens = (tokens: FoundationToken[]) => tokens.filter(token => !token.key.includes('--'))
export function tokenClass(namespace: string, key: string) {
  const prefixes: Record<string, string> = { color: 'bg', 'color-surface': 'bg-surface', 'color-line': 'b-line', 'color-text': 'fg-text', radius: 'r', 'font-feature': 'font-feature-settings', spacing: 'gap', container: 'max-w', duration: 'animation-duration', easing: 'animation-timing-function' }
  return `${prefixes[namespace] ?? namespace}-${key}`
}
const descriptions: Record<string, Record<string, string>> = {
  'color-surface': { base: 'Root page or app background.', inset: 'Recessed regions and inset sections.', raised: 'Raised cards, controls, and stacked surfaces.', floating: 'Floating dialogs, popovers, and menus.', inverse: 'High-contrast inverse surfaces.' },
  'color-line': { divider: 'Decorative dividers; not required control boundaries.', control: 'Required control boundaries on opaque preset surfaces.', subtle: 'Low-contrast hairlines and soft outlines.' },
  'color-text': { body: 'Default readable foreground text.', strong: 'Headings, labels, and emphasized text.', muted: 'Secondary text on base, inset, or raised; use body on floating.', disabled: 'Unavailable actions and disabled controls.', inverse: 'Text on inverse surfaces.', link: 'Default inline links.', 'link-hover': 'Interactive link hover state.' },
}
export function tokenAdvice(namespace: string, key: string) {
  if (namespace === 'shadow') { const row = getShadowRows().find(row => row.key === key); return row ? `${row.role}. ${row.description}` : '' }
  return descriptions[namespace]?.[key] ?? (namespace === 'color-text' ? `Mode-aware ${key} foreground text.` : namespace === 'color' ? `${key} color; inspect the authored value and scope below.` : '')
}
export const specimenCaption: Record<string, string> = {
  color: 'Fixed steps keep their colors across modes. Hue aliases and special values are shown separately. Copy either the original CSS value or its variable reference.',
  'color-surface': 'Compare complete surfaces in light and dark. Inverse surfaces use inverse text. Role descriptions are design guidance, not component restrictions.',
  'color-line': 'Each token paints a boundary, with identical line width in both modes. Divider and subtle are decorative; control is intended for required boundaries.',
  'color-text': 'Each token paints real text, on its intended surface, in both modes. Check contrast in your actual composition.',
  radius: 'Identical shapes reveal each radius. The pill token rounds a wide control and makes an equal-sided control circular.',
  shadow: 'The same raised surface, radius and padding at every level. The full shadow has room to spread. Suggested uses are design guidance.',
  spacing: 'Pink stripes show the actual gap between equal blocks. Pixel equivalents assume a 16px root; authored rem values follow the root font size.',
  container: 'Bars show relative width caps on one shared scale. Exact values remain in the table; changing a size token does not change a container-query threshold.',
  'font-size': 'Actual preset font sizes, without scaling or fixed-height clipping. Large specimens wrap within the reading column.',
  text: 'Each treatment applies its actual size, line height and tracking. Weight, family and color are separate choices.',
  'font-family': 'Compare the same sentence and letterforms in each font stack. Available system fonts determine the rendered face.',
  'font-weight': 'Identical text, size and family isolate the selected weight. The available font determines which weights it can draw.',
  leading: 'The same multi-line paragraph at every line height. Compare reading rhythm and block height.',
  tracking: 'The same long phrase at every letter spacing. Compare the space between glyphs without changing size.',
  'font-feature': 'Compare proportional and tabular digits using the same font, size and numbers. Feature support depends on the chosen font.',
  animate: 'Every primary animation starts paused. Play, Pause and Replay control the native timelines; reduced motion keeps the content still. Companion values are listed with their primary token below.',
  duration: 'All markers travel the same path with linear timing; only duration changes. Start paused, then Play or Replay together. Reduced motion keeps them still.',
  easing: 'All markers travel the same path over one second; only timing changes. Overshoot and rewind may pass the endpoints. Reduced motion keeps them still.',
  content: 'An empty generated content value creates the decorative dot; the status remains real text in the document.',
  order: 'Compare each preset order token on the middle item. Visual arrangement changes; DOM, reading and keyboard order stay 1, 2, 3.',
}
const label = (namespace: string, token: FoundationToken) => `<div data-ui="label"><code>${escape(tokenClass(namespace, token.key))}</code> · <code>--${escape(token.name)}</code>${['shadow', 'color', 'color-line', 'color-surface', 'color-text'].includes(namespace) ? '' : ` · ${escape(defaultValue(token))}`}</div>`
const paragraph = 'Good typography makes room for the reader. A comfortable measure and a steady rhythm help the eye move from one line to the next, keeping the focus on the ideas rather than the interface.'

/** Site-authored presentation only. Classes and var() references are resolved by the public compiler. */
export function foundationScene(namespace: string, selected?: string[]): DemoScene {
  const tokens = primaryTokens(specimenTokens(namespace, selected))
  const caption = specimenCaption[namespace]
  const scene: DemoScene = { html: '', caption, sizing: 'content', bodyClass: 'bg-surface-base fg-text-body', css: '' }
  if (namespace === 'color') {
    scene.html = `<div data-foundation="colors">${tokens.map(token => `<section>${label(namespace, token)}<div data-color-swatch class="bg-${token.key}" aria-label="${escape(token.key)} swatch"></div><p data-ui="label">${escape(defaultValue(token))}</p></section>`).join('')}</div>`
    scene.css = '[data-foundation="colors"] { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr)); gap:24px; } [data-color-swatch] { height:64px; border-radius:var(--radius-sm); outline:1px solid var(--color-line-divider); outline-offset:-1px; }'
  } else if (namespace.startsWith('color-')) {
    scene.html = `<div data-foundation="roles">${tokens.map(token => {
      const advice = tokenAdvice(namespace, token.key)
      const utility = tokenClass(namespace, token.key)
      const inverse = token.key === 'inverse'
      const preview = namespace === 'color-text'
        ? `<div class="p-lg r-sm ${inverse ? 'bg-surface-inverse' : 'bg-surface-raised'}"><p data-role-preview="text" class="margin:0 text-xl font-weight-medium ${utility}">The details make the difference.</p><p class="margin:0 text-sm ${utility}">0123456789 · ${escape(token.key)}</p></div>`
        : namespace === 'color-line'
          ? `<div data-role-preview="line" class="p-lg r-sm border-width:1px border-style:solid bg-surface-raised ${utility}"><span class="text-sm">${escape(token.key === 'control' ? 'Email address' : 'Collection details')}</span><div class="mt-md border-top-width:1px border-top-style:solid ${utility}"></div></div>`
          : `<div data-role-preview="surface" class="p-lg r-sm ${utility} ${inverse ? 'fg-text-inverse' : 'fg-text-body'}"><strong class="text-md">${escape(token.key)}</strong><p class="margin:0 text-sm">A surface for your content.</p></div>`
      return `<section>${label(namespace, token)}${preview}<p data-ui="label">${escape(advice)}</p></section>`
    }).join('')}</div>`
    scene.css = '[data-foundation="roles"] { display:grid; gap:24px; }'
  } else if (namespace === 'radius') {
    scene.html = `<div data-foundation="radius">${tokens.map(token => `<section>${label(namespace, token)}<div data-radius-shape class="r-${token.key} bg-surface-raised shadow-sm"><span class="fg-text-muted text-sm">${token.key}</span></div>${token.key === 'pill' ? '<div data-radius-circle class="r-pill bg-surface-raised shadow-sm" aria-label="Equal width and height form a circle">+</div>' : ''}</section>`).join('')}</div>`
    scene.css = '[data-foundation="radius"] { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,140px),1fr)); gap:32px; } [data-radius-shape] { display:grid; place-items:center; height:96px; width:128px; max-width:100%; } [data-radius-circle] { display:grid; place-items:center; width:48px; height:48px; margin-top:16px; font-size:24px; }'
  } else if (namespace === 'shadow') {
    scene.html = `<div data-foundation="shadow">${tokens.map(token => `<section>${label(namespace, token)}<article data-shadow-card class="p-lg r-lg bg-surface-raised shadow-${token.key}"><div class="text-md font-weight-medium fg-text-strong">${escape(getShadowRows().find(row => row.key === token.key)?.role ?? token.key)}</div><p class="mt-xs margin-bottom:0 text-sm fg-text-muted">${escape(getShadowRows().find(row => row.key === token.key)?.description ?? '')}</p></article></section>`).join('')}</div>`
    scene.css = 'body { padding:32px 24px 64px; } [data-foundation="shadow"] { display:grid; gap:48px; } [data-shadow-card] { min-height:128px; }'
  } else if (['font-family', 'font-size', 'font-weight', 'text', 'leading', 'tracking', 'font-feature'].includes(namespace)) {
    scene.html = `<div data-foundation="typography">${tokens.map(token => {
      const utility = tokenClass(namespace, token.key)
      const text = namespace === 'leading' ? paragraph : namespace === 'font-family' ? 'The quick brown fox jumps over the lazy dog. 0123456789' : ['font-size', 'text'].includes(namespace) ? 'Design for people.' : namespace === 'tracking' ? 'Make space for extraordinary ideas.' : 'A thoughtful balance. Aa 0123456789'
      return `<section>${label(namespace, token)}${namespace === 'font-feature'
        ? `<div data-ui="comparison"><div><div data-ui="label">Proportional</div><p data-type-target class="margin:0 font-size-xl">111.11<br>888.88<br>123.45</p></div><div><div data-ui="label">Tabular</div><p data-type-target class="margin:0 font-size-xl ${utility}">111.11<br>888.88<br>123.45</p></div></div>`
        : `<p data-type-target class="margin:0 ${['font-size', 'text', 'leading'].includes(namespace) ? '' : 'font-size-xl'} ${utility}">${text}</p>`}</section>`
    }).join('')}</div>`
    scene.css = '[data-foundation="typography"] { display:grid; gap:32px; } [data-foundation="typography"] > section + section { border-top:1px solid var(--color-line-divider); padding-top:24px; } [data-type-target] { overflow-wrap:anywhere; }'
    if (namespace === 'leading') scene.css += ' [data-type-target] { max-width:38ch; font-size:16px; }'
  } else if (['animate', 'duration', 'easing'].includes(namespace)) {
    scene.motion = true
    scene.html = `<div data-foundation="motion">${tokens.map(token => `<section>${label(namespace, token)}<div data-motion-path><div id="motion-${token.key}" data-motion-marker class="bg-blue-60 r-sm ${namespace === 'animate' ? `animate-${token.key}@motion-safe animation-iteration-count:1@motion-safe` : `animation-name:foundation-travel@motion-safe animation-duration:${namespace === 'duration' ? `var(--${token.name})` : '1s'} animation-timing-function:${namespace === 'easing' ? `var(--${token.name})` : 'linear'} animation-fill-mode:both`}">${namespace === 'animate' ? 'M' : '→'}</div></div><output data-ui="label" data-animation-readout="motion-${token.key}">Paused</output></section>`).join('')}</div>`
    scene.css = '@keyframes foundation-travel { from { left:0; } to { left:calc(100% - 40px); } } [data-foundation="motion"] { display:grid; gap:24px; } [data-motion-path] { position:relative; height:64px; margin:12px 24px; border-bottom:1px dashed var(--color-line-divider); } [data-motion-marker] { position:relative; display:grid; place-items:center; width:40px; height:40px; color:white; } @media(prefers-reduced-motion:reduce) { [data-motion-marker] { animation:none!important; } }'
  } else if (namespace === 'container') {
    const max = Math.max(...tokens.map(token => token.numeric?.value ?? 0))
    scene.html = tokens.map(token => `<section>${label(namespace, token)}<div data-size-bar style="width:${(token.numeric?.value ?? 0) / max * 100}%" class="bg-blue-60 r-xs"></div></section>`).join('')
    scene.css = '[data-size-bar] { height:16px; margin-bottom:24px; }'
  } else if (namespace === 'content') {
    scene.html = '<p class="display:flex align-items:center gap-sm content-empty::before display:block::before width:.5rem::before height:.5rem::before r-pill::before bg-green-60::before">All changes saved</p>'
  } else if (namespace === 'order') {
    if (tokens.length) {
      scene.html = tokens.map(token => `<section>${label(namespace, token)}<p>DOM order: 1, 2, 3.</p><div class="display:flex flex-wrap:wrap gap-sm"><div data-ui="tile">1 · Notes</div><div data-ui="tile" class="order-${token.key}">2 · Featured</div><div data-ui="tile">3 · Archive</div></div></section>`).join('')
      scene.css = 'section + section { margin-top:32px; }'
    } else {
      scene.css = '@theme { :root { --order-featured: -1; } }'
      scene.html = '<p>No preset values. Project-defined example:</p><div class="display:flex gap-sm"><span>Notes</span><span class="order-featured">Featured</span></div>'
    }
  }
  if (namespace === 'radius' || namespace === 'shadow') scene.css += ' body { background-image:linear-gradient(135deg,var(--color-line-subtle) 4.5%,transparent 0,transparent 50%,var(--color-line-subtle) 0,var(--color-line-subtle) 54.5%,transparent 0); background-size:7.5px 7.5px; }'
  return scene
}
