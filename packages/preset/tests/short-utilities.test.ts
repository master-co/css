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

const MARGIN = [['m', 'margin'], ['mt', 'margin-top'], ['mr', 'margin-right'], ['mb', 'margin-bottom'], ['ml', 'margin-left'], ['mx', 'margin-inline'], ['mxs', 'margin-inline-start'], ['mxe', 'margin-inline-end'], ['my', 'margin-block'], ['mys', 'margin-block-start'], ['mye', 'margin-block-end']] as const
const PADDING = MARGIN.map(([name, property]) => [name.replace('m', 'p'), property.replace('margin', 'padding')] as const)
const INSET = [['top', 'top'], ['right', 'right'], ['bottom', 'bottom'], ['left', 'left'], ['inset', 'inset'], ['ix', 'inset-inline'], ['ixs', 'inset-inline-start'], ['ixe', 'inset-inline-end'], ['iy', 'inset-block'], ['iys', 'inset-block-start'], ['iye', 'inset-block-end']] as const
const SIZES = [['w', 'width'], ['h', 'height'], ['size-x', 'inline-size'], ['size-y', 'block-size'], ['min-w', 'min-width'], ['min-h', 'min-height'], ['min-size-x', 'min-inline-size'], ['min-size-y', 'min-block-size']] as const
const MAX_SIZES = [['max-w', 'max-width'], ['max-h', 'max-height'], ['max-size-x', 'max-inline-size'], ['max-size-y', 'max-block-size']] as const
const BORDER_SIDES = [['b', ''], ['bt', 'top'], ['br', 'right'], ['bb', 'bottom'], ['bl', 'left'], ['bx', 'inline'], ['bxs', 'inline-start'], ['bxe', 'inline-end'], ['by', 'block'], ['bys', 'block-start'], ['bye', 'block-end']] as const
const border = (side: string, kind: string) => side ? `border-${side}-${kind}` : `border-${kind}`

/** The 94 fixed utilities that predate the complete short-utility set. */
const FIXED_UTILITIES = [
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

/** The 143 single-declaration statics of the complete short-utility set. */
const ADDED_UTILITIES = [
  ...[...MARGIN, ...INSET, ...SIZES, ['basis', 'flex-basis']].map(([name, property]) => [`${name}-auto`, property, 'auto'] as const),
  ...MAX_SIZES.map(([name, property]) => [`${name}-none`, property, 'none'] as const),
  ...[...BORDER_SIDES.map(([name, side]) => [name, border(side, 'style')] as const), ['outline', 'outline-style'] as const]
    .flatMap(([name, property]) => prefixed(name, property, ['solid', 'dashed', 'dotted', 'double', 'none'])),
  ...prefixed('text', 'text-align', ['left', 'center', 'right', 'start', 'end', 'justify']),
  ...['overflow', 'overflow-x', 'overflow-y'].flatMap((name) => prefixed(name, name, ['auto', 'hidden', 'clip', 'visible', 'scroll'])),
  ...prefixed('whitespace', 'white-space', ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces']),
  ...prefixed('select', 'user-select', ['none', 'text', 'all', 'auto']),
  ...prefixed('pointer', 'pointer-events', ['none', 'auto']),
  ...prefixed('vertical', 'vertical-align', ['baseline', 'top', 'middle', 'bottom', 'text-top', 'text-bottom', 'sub', 'super']),
  ['container-inline', 'container-type', 'inline-size'],
  ['container-size', 'container-type', 'size'],
  ['container-normal', 'container-type', 'normal'],
  ...prefixed('wrap', 'overflow-wrap', ['anywhere', 'break-word', 'normal']),
  ['ellipsis', 'text-overflow', 'ellipsis']
] as const

const SHORT_UTILITIES = [...FIXED_UTILITIES, ...ADDED_UTILITIES]

/** The 97 pixel-length functions and 3 unitless functions. */
const LENGTH_FUNCTIONS = [
  ...MARGIN,
  ...PADDING,
  ...MARGIN.map(([name, property]) => [`scroll-${name}`, `scroll-${property}`] as const),
  ...PADDING.map(([name, property]) => [`scroll-${name}`, `scroll-${property}`] as const),
  ...INSET,
  ['gap', 'gap'], ['gap-x', 'column-gap'], ['gap-y', 'row-gap'], ['border-spacing', 'border-spacing'], ['outline-offset', 'outline-offset'], ['shape-margin', 'shape-margin'], ['translate', 'translate'], ['word-spacing', 'word-spacing'],
  ...SIZES, ...MAX_SIZES, ['basis', 'flex-basis'],
  ['r', 'border-radius'], ['rtl', 'border-top-left-radius'], ['rtr', 'border-top-right-radius'], ['rbl', 'border-bottom-left-radius'], ['rbr', 'border-bottom-right-radius'], ['rss', 'border-start-start-radius'], ['rse', 'border-start-end-radius'], ['res', 'border-end-start-radius'], ['ree', 'border-end-end-radius'],
  ...BORDER_SIDES.map(([name, side]) => [name, border(side, 'width')] as const),
  ['outline', 'outline-width']
] as const
const UNITLESS_FUNCTIONS = [['grow', 'flex-grow', 'number'], ['shrink', 'flex-shrink', 'number'], ['order', 'order', 'integer']] as const

let engine: ReturnType<typeof createEngineBindingSessionSync>

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = fileURLToPath(new URL('../../binding/artifacts/mastercss.node', import.meta.url))
  engine = createEngineBindingSessionSync({ manifest })
  return () => engine.dispose()
})

const order = (classes: string[]) => {
  const session = createEngineBindingSessionSync({ manifest })
  try {
    session.ensureClassRules(classes)
    return session.snapshot().rules.map(({ className }) => className)
  } finally {
    session.dispose()
  }
}

describe('preset short utilities', () => {
  it('registers 237 single-declaration statics, two recipes, 105 functions and 119 token definitions', () => {
    const names = SHORT_UTILITIES.map(([name]) => name)
    expect(FIXED_UTILITIES).toHaveLength(94)
    expect(ADDED_UTILITIES).toHaveLength(143)
    expect(new Set(names).size).toBe(237)
    const utilities = manifest.utilities ?? []
    expect(utilities).toHaveLength(463)
    expect(utilities.filter(({ kind }) => kind === 'static').map(({ name }) => name).sort()).toEqual(['sr-only', 'truncate', ...names].sort())
    expect(utilities.filter(({ kind }) => kind === 'function')).toHaveLength(105)
    expect(utilities.filter(({ kind }) => kind === 'token')).toHaveLength(119)
    for (const [name, property, value] of SHORT_UTILITIES) {
      const definition = utilities.find((utility) => utility.kind === 'static' && utility.name === name)
      expect(definition?.body, name).toEqual([{ type: 'declaration', property, value: [{ type: 'text', value }] }])
    }
    expect(LENGTH_FUNCTIONS).toHaveLength(97)
    for (const [name, property] of LENGTH_FUNCTIONS) {
      const definition = utilities.find((utility) => utility.kind === 'function' && utility.name === name)
      expect(definition?.parameters, name).toEqual([{ name: '--value', syntax: 'number' }])
      expect(engine.inspect(`${name}(4)`).rules[0]?.text, name).toBe(`.${name}\\(4\\){${property}:calc(4 * 1px)}`)
    }
    for (const [name, property, syntax] of UNITLESS_FUNCTIONS) {
      const definition = utilities.find((utility) => utility.kind === 'function' && utility.name === name)
      expect(definition?.parameters, name).toEqual([{ name: '--value', syntax }])
      expect(engine.inspect(`${name}(2)`).rules[0]?.text, name).toBe(`.${name}\\(2\\){${property}:2}`)
    }
  })

  it('emits only its one declaration, with no implied display or reset', () => {
    for (const [name, property, value] of SHORT_UTILITIES) {
      const [rule] = engine.inspect(name).rules
      const declaration = `${property}:${value}`
      expect(rule?.text, name).toBe(`.${name}{${property === 'user-select' ? `-webkit-${declaration};` : ''}${declaration}}`)
      expect(rule?.layer).toBe('utilities')
    }
    // `flex-col` never implies `display:flex`, and decoration lines leave color, style and thickness alone.
    expect(engine.inspect('flex-col').rules[0].text).not.toContain('display')
    expect(engine.inspect('underline').rules[0].text).toBe('.underline{text-decoration-line:underline}')
    // Styles never imply widths or colors; widths never imply styles.
    expect(engine.inspect('b-none').rules[0].text).toBe('.b-none{border-style:none}')
    expect(engine.inspect('outline-none').rules[0].text).toBe('.outline-none{outline-style:none}')
    expect(engine.inspect('b(0)').rules[0].text).toBe('.b\\(0\\){border-width:calc(0 * 1px)}')
    expect(engine.inspect('truncate').rules[0].text).toBe('.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}')
  })

  it('shares the native compatibility declarations of the same property', () => {
    for (const value of ['none', 'text', 'all', 'auto']) {
      const native = engine.inspect(`(user-select:${value})`).rules[0].text
      expect(engine.inspect(`select-${value}`).rules[0].text.replace(`.select-${value}`, '')).toBe(native.slice(native.indexOf('{')))
    }
    expect(engine.inspect('select-none!').rules[0].text).toBe('.select-none\\!{-webkit-user-select:none!important;user-select:none!important}')
  })

  it('accepts static numbers and rejects other units without a fallback', () => {
    for (const [className, declaration] of [
      ['m(0)', 'margin:calc(0 * 1px)'],
      ['m(1.5)', 'margin:calc(1.5 * 1px)'],
      ['m(-4)', 'margin:calc(-4 * 1px)'],
      ['top(-0.5)', 'top:calc(-0.5 * 1px)'],
      ['grow(1)', 'flex-grow:1'],
      ['shrink(0)', 'flex-shrink:0'],
      ['grow(0.5)', 'flex-grow:0.5'],
      ['order(-1)', 'order:-1']
    ] as const) {
      expect(engine.inspect(className).rules[0]?.text, className).toContain(`{${declaration}}`)
    }
    for (const invalid of ['m(1px)', 'b(var(--x))', 'm(auto)', 'order(1.5)', 'grow(1px)', 'm()', 'm(1,2)']) {
      const inspection = engine.inspect(invalid)
      expect(inspection.rules, invalid).toEqual([])
      expect(inspection.diagnostics?.length, invalid).toBeGreaterThan(0)
    }
  })

  it('substitutes the inline keyword constants', () => {
    expect(engine.inspect('w-full').rules[0].text).toBe('.w-full{width:100%}')
    expect(engine.inspect('max-w-fit').rules[0].text).toBe('.max-w-fit{max-width:fit-content}')
    expect(engine.inspect('basis-min').rules[0].text).toBe('.basis-min{flex-basis:min-content}')
    expect(engine.inspect('h-max').rules[0].text).toBe('.h-max{height:max-content}')
    expect(engine.inspect('order-first').rules[0].text).toBe('.order-first{order:-999999}')
    expect(engine.inspect('order-last').rules[0].text).toBe('.order-last{order:999999}')
    for (const className of ['w-full', 'order-first']) expect(engine.inspect(className).rules[0].variableNames ?? []).toEqual([])
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
    expect(engine.inspect('block#target').rules[0].text).toBe('.block\\#target#target{display:block}')
    expect(engine.inspect('(flex:1|1|auto):hover').rules[0].text).toBe('.\\(flex\\:1\\|1\\|auto\\)\\:hover:hover{flex:1 1 auto}')
    expect(engine.inspect('m(4):hover@sm!').rules[0].text).toBe('@media (width >= 52.125rem){.m\\(4\\)\\:hover\\@sm\\!:hover{margin:calc(4 * 1px)!important}}')
    expect(engine.inspect('text-center[aria-expanded=true]').rules[0].text).toBe('.text-center\\[aria-expanded\\=true\\][aria-expanded=true]{text-align:center}')
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
      ['basis-sm', 'flex-basis:var(--container-sm)'],
      ['grid-cols(3)', 'grid-template-columns:repeat(3, minmax(0, 1fr))'],
      ['text-sm', 'font-size:var(--text-sm)'],
      ['font-bold', 'font-weight:var(--font-weight-bold)'],
      ['r-pill', 'border-radius:var(--radius-pill)'],
      ['sr-only', 'position:absolute'],
      ['clamp-lines(2)', '-webkit-line-clamp:2'],
      ['b-red-60', 'border-color:var(--color-red-60)'],
      ['bys-red-60', 'border-block-start-color:var(--color-red-60)'],
      ['rss-md', 'border-start-start-radius:var(--radius-md)'],
      ['accent-blue-60', 'accent-color:var(--color-blue-60)'],
      ['caret-blue-60', 'caret-color:var(--color-blue-60)'],
      ['-mx-md', 'margin-inline:calc(var(--spacing-md) * -1)']
    ] as const) {
      expect(engine.inspect(className).rules[0]?.text, className).toContain(declaration)
    }
    for (const absent of [
      'abs', 'rel', 'center', 'middle', 'full', 'fit', 'round', 'container', 'untouchable', 'video', 'square', 'not-sr-only', 'bg-cover', 'font-bolder', 'flex-column', 'display-none', 'border-box',
      // No zero aliases, numeric matches, synonyms, duplicate statics, old prefixes or text-indent family.
      'm-0', 'b-0', 'p-0', 'min-w-0', 'm-4', 'border-solid', 'no-outline', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'align-center', 'grow', 'grow-0', 'shrink', 'shrink-0', 'indent-sm',
      'text-indent-sm', 'flex-basis-sm', 'accent-color-blue-60', 'caret-color-blue-60', 'border-block-start-color-red-60', 'border-start-start-radius-md'
    ]) {
      expect(engine.inspect(absent).rules, absent).toEqual([])
    }
  })

  it('orders recipes, then atomics by family and coverage, then native declarations', () => {
    expect(order(['(display:contents)', 'inline-flex', 'hidden', 'block'])).toEqual(['block', 'inline-flex', 'hidden', '(display:contents)'])
    // A later side or axis overrides its family whatever registered it.
    expect(order(['mt(0)', 'm-md'])).toEqual(['m-md', 'mt(0)'])
    expect(order(['mt-md', 'm(4)'])).toEqual(['m(4)', 'mt-md'])
    expect(order(['mx-auto', 'm-md'])).toEqual(['m-md', 'mx-auto'])
    expect(order(['ml(0)', 'mx(4)', 'm(8)'])).toEqual(['m(8)', 'mx(4)', 'ml(0)'])
    // Width, style and color are independent families: only coverage orders within each.
    expect(order(['b-red-60', 'b-solid', 'bt(0)', 'b(2)'])).toEqual(['b-red-60', 'b-solid', 'b(2)', 'bt(0)'])
    // Same property: tokens precede functions and statics; native declarations come last.
    expect(order(['m(4)', 'm-md'])).toEqual(['m-md', 'm(4)'])
    expect(order(['(margin:2rem)', 'm(4)'])).toEqual(['m(4)', '(margin:2rem)'])
    // Recipes precede the atomics they combine with.
    expect(order(['whitespace-normal', 'truncate'])).toEqual(['truncate', 'whitespace-normal'])
    const classes = ['m(8)', 'mx(4)', 'ml(0)', 'b-solid', 'b(2)', 'bt(0)', 'truncate', '(margin:1px)', 'm-md', 'overflow-x-auto', 'overflow-hidden', 'gap-y(4)', 'gap(8)', 'r(4)', 'rtl-md']
    const expected = order(classes)
    expect(order([...classes].reverse())).toEqual(expected)
    const session = createEngineBindingSessionSync({ manifest })
    try {
      session.ensureClassRules(classes)
      session.deleteClassRules(['mx(4)', 'truncate'])
      session.ensureClassRules(['truncate', 'mx(4)'])
      expect(session.snapshot().rules.map(({ className }) => className)).toEqual(expected)
    } finally {
      session.dispose()
    }
  })

  it('reserves exact fixed names, never their token keys, when same-named tokens exist', () => {
    const variables = structuredClone(manifest.variables) as Record<string, object[]>
    const token = (key: string, value: string) => ({ key, values: [{ path: [':root,:host'], value }], dependencies: [] })
    variables.text.push(token('center', '2rem'))
    variables.color.push(token('solid', 'red'))
    variables.spacing.push({ ...token('auto', '3px'), type: 'number', numeric: { value: 3, unit: 'px' } })
    variables['font-size'].push(token('bold', '9px'))
    const session = createEngineBindingSessionSync({ manifest: { ...manifest, variables } as MasterCSSManifest })
    try {
      const text = (className: string) => session.inspect(className).rules.map((rule) => rule.text).join('')
      expect(text('text-center')).toBe('.text-center{text-align:center}')
      expect(text('b-solid')).toBe('.b-solid{border-style:solid}')
      expect(text('mx-auto')).toBe('.mx-auto{margin-inline:auto}')
      // Other spellings of the same keys still reach the tokens.
      expect(text('fg-solid')).toBe('.fg-solid{color:var(--color-solid)}')
      expect(text('b-solid/.5')).toBe('.b-solid\\/\\.5{border-color:color-mix(in oklab,var(--color-solid) 50%,transparent)}')
      expect(text('-mx-auto')).toBe('.-mx-auto{margin-inline:calc(var(--spacing-auto) * -1)}')
      expect(text('my-auto')).toBe('.my-auto{margin-block:auto}')
      // A key in several namespaces of one prefix stays ambiguous and emits nothing.
      const ambiguous = session.inspect('font-bold')
      expect(ambiguous.rules).toEqual([])
      expect(ambiguous.diagnostics?.map(({ code }) => code)).toContain('AMBIGUOUS_TOKEN')
    } finally {
      session.dispose()
    }
  })
})
