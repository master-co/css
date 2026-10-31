import { beforeAll, describe, expect, it } from 'vitest'
import { fileURLToPath } from 'node:url'
import { createEngineBindingSessionSync } from '@master/css-binding/engine/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifestJSON from '../src/default-manifest.json' with { type: 'json' }

const manifest = defaultManifestJSON as unknown as MasterCSSManifest

const same = (property: string, names: string[]) => names.map((name) => [name, property, name] as const)
const prefixed = (prefix: string, property: string, values: string[]) => values.map((value) => [`${prefix}-${value}`, property, value] as const)
const spaced = (prefix: string, property: string) => ['between', 'around', 'evenly'].map((value) => [`${prefix}-${value}`, property, `space-${value}`] as const)
const ALIGN = ['normal', 'start', 'end', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch']

/** Each short utility emits exactly this one declaration. */
const SHORT_UTILITIES = [
  ...same('display', ['block', 'inline', 'inline-block', 'flow-root', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents', 'list-item', 'table', 'inline-table', 'table-caption', 'table-cell', 'table-column', 'table-column-group', 'table-header-group', 'table-footer-group', 'table-row', 'table-row-group']),
  ['hidden', 'display', 'none'],
  ...same('position', ['static', 'relative', 'absolute', 'fixed', 'sticky']),
  ['visible', 'visibility', 'visible'],
  ['invisible', 'visibility', 'hidden'],
  ['isolate', 'isolation', 'isolate'],
  ['box-border', 'box-sizing', 'border-box'],
  ['box-content', 'box-sizing', 'content-box'],
  ...same('font-style', ['italic', 'oblique']),
  ...same('text-transform', ['uppercase', 'lowercase', 'capitalize']),
  ...same('text-decoration-line', ['underline', 'overline', 'line-through']),
  ['flex-row', 'flex-direction', 'row'],
  ['flex-row-reverse', 'flex-direction', 'row-reverse'],
  ['flex-col', 'flex-direction', 'column'],
  ['flex-col-reverse', 'flex-direction', 'column-reverse'],
  ['flex-wrap', 'flex-wrap', 'wrap'],
  ['flex-nowrap', 'flex-wrap', 'nowrap'],
  ['flex-wrap-reverse', 'flex-wrap', 'wrap-reverse'],
  ...prefixed('items', 'align-items', ALIGN),
  ...prefixed('content', 'align-content', ALIGN),
  ...spaced('content', 'align-content'),
  ...prefixed('self', 'align-self', ['auto', ...ALIGN]),
  ...prefixed('justify', 'justify-content', ['normal', 'start', 'end', 'flex-start', 'flex-end', 'center']),
  ...spaced('justify', 'justify-content'),
  ['justify-stretch', 'justify-content', 'stretch'],
  ...prefixed('object', 'object-fit', ['cover', 'contain', 'fill', 'none', 'scale-down']),
  ...prefixed('object', 'object-position', ['center', 'top', 'bottom', 'left', 'right'])
] as const

let engine: ReturnType<typeof createEngineBindingSessionSync>

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(new URL('../../binding/artifacts/mastercss.node', import.meta.url))
  engine = createEngineBindingSessionSync({ manifest })
  return () => engine.dispose()
})

describe('preset short utilities', () => {
  it('registers exactly 94 unique static definitions next to the existing recipes', () => {
    const names = SHORT_UTILITIES.map(([name]) => name)
    expect(names).toHaveLength(94)
    expect(new Set(names).size).toBe(94)
    const utilities = manifest.utilities ?? []
    expect(utilities).toHaveLength(220)
    expect(utilities.filter(({ kind }) => kind === 'static').map(({ name }) => name).sort()).toEqual(['sr-only', ...names].sort())
    for (const [name, property, value] of SHORT_UTILITIES) {
      const definition = utilities.find((utility) => utility.kind === 'static' && utility.name === name)
      expect(definition?.body, name).toEqual([{ type: 'declaration', property, value: [{ type: 'text', value }] }])
    }
  })

  it('emits only its one declaration, with no implied display or reset', () => {
    for (const [name, property, value] of SHORT_UTILITIES) {
      const [rule] = engine.inspect(name).rules
      expect(rule?.text, name).toBe(`.${name}{${property}:${value}}`)
      expect(rule?.layer).toBe('utilities')
    }
    // `flex-col` never implies `display:flex`, and decoration lines leave color, style and thickness alone.
    expect(engine.inspect('flex-col').rules[0].text).not.toContain('display')
    expect(engine.inspect('underline').rules[0].text).toBe('.underline{text-decoration-line:underline}')
  })

  it('keeps the native start/end and flex-start/flex-end distinction', () => {
    expect(engine.inspect('items-start').rules[0].text).toContain('align-items:start')
    expect(engine.inspect('items-flex-start').rules[0].text).toContain('align-items:flex-start')
    expect(engine.inspect('justify-end').rules[0].text).toContain('justify-content:end')
    expect(engine.inspect('justify-flex-end').rules[0].text).toContain('justify-content:flex-end')
  })

  it('composes with selectors, conditions, importance and @apply like other statics', () => {
    expect(engine.inspect('flex:hover').rules[0].text).toBe('.flex\\:hover:hover{display:flex}')
    expect(engine.inspect('hidden@sm').rules[0].text).toBe('@media (width >= 52.125rem){.hidden\\@sm{display:none}}')
    expect(engine.inspect('block!').rules[0].text).toBe('.block\\!{display:block!important}')
    expect(engine.inspect('relative_li').rules[0].text).toBe('.relative_li li{position:relative}')
    expect(engine.inspect('(flex:1|1|auto):hover').rules[0].text).toBe('.\\(flex\\:1\\|1\\|auto\\)\\:hover:hover{flex:1 1 auto}')
  })

  it('generates nothing until a class is used', () => {
    const session = createEngineBindingSessionSync({ manifest })
    try {
      expect(session.snapshot().text).not.toContain('display:')
      session.ensureClassRules(['flex'])
      const text = session.snapshot().text
      expect(text).toContain('.flex{display:flex}')
      expect(text).not.toContain('.block{')
      expect(text).not.toContain('.hidden{')
    } finally {
      session.dispose()
    }
  })

  it('leaves token families, recipes and named collisions intact', () => {
    for (const [className, declaration] of [
      ['flex-basis-sm', 'flex-basis:var(--container-sm)'],
      ['grid-cols(3)', 'grid-template-columns:repeat(3, minmax(0, 1fr))'],
      ['text-sm', 'font-size:var(--text-sm)'],
      ['font-bold', 'font-weight:var(--font-weight-bold)'],
      ['r-pill', 'border-radius:var(--radius-pill)'],
      ['sr-only', 'position:absolute'],
      ['clamp-lines(2)', '-webkit-line-clamp:2']
    ] as const) {
      expect(engine.inspect(className).rules[0]?.text, className).toContain(declaration)
    }
    for (const absent of ['abs', 'rel', 'center', 'middle', 'full', 'fit', 'round', 'container', 'untouchable', 'video', 'square', 'not-sr-only', 'bg-cover', 'b-solid', 'outline-none', 'font-bolder', 'text-center', 'flex-column', 'display-none', 'border-box']) {
      expect(engine.inspect(absent).rules, absent).toEqual([])
    }
  })

  it('orders statics before native declarations of the same tier, and among themselves by name', () => {
    const session = createEngineBindingSessionSync({ manifest })
    try {
      session.ensureClassRules(['(display:contents)', 'inline-flex', 'hidden', 'block'])
      const order = session.snapshot().rules.map(({ className }) => className)
      expect(order).toEqual(['block', 'hidden', 'inline-flex', '(display:contents)'])
    } finally {
      session.dispose()
    }
  })
})
