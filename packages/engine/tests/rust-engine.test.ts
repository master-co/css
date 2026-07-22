import { beforeAll, describe, expect, it } from 'vitest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import defaultManifest from '@master/css-preset/default-manifest.json'
import MasterCSS from '../src/core'
import createEngine from '../src/create-engine'
import { createEngineSync } from '../src/node'
import { MasterCSSEngineError } from '../src/backend'
import builtinKeyAliases from '../src/key-aliases'

const typedDefaultManifest = defaultManifest as unknown as MasterCSSManifest

const manifest: MasterCSSManifest = {
  version: 1,
  conditions: {
    sm: { id: 'media', nodes: [{ type: 'number', value: 52.125, unit: 'rem' }] }
  },
  variants: [{ token: '@base', branches: [{ layer: 'base' }] }],
  utilities: [
    {
      id: 'display-block',
      name: 'block',
      type: -2,
      emit: { type: 'static', rules: [{ declarations: { display: 'block' } }] },
      matchers: [{ type: 'static', name: 'block' }]
    },
    {
      id: 'bg-origin',
      type: -2,
      emit: { type: 'static', rules: [{ declarations: { 'background-origin': null } }] },
      matchers: [{
        type: 'pattern',
        prefix: 'bg-origin-',
        values: ['border'],
        valueMap: { border: 'border-box' }
      }]
    },
    {
      id: 'width',
      name: 'width',
      type: 0,
      emit: { type: 'property', property: 'width' },
      matchers: [{ type: 'key', keys: ['w'] }]
    }
  ]
}

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

describe('Rust engine differential slice', () => {
  it('uses Wasm for auto backend when native addons are disabled', async () => {
    process.execArgv.push('--no-addons')
    try {
      const rust = await createEngine({ manifest, backend: 'auto' })
      try {
        expect(rust.backend).toBe('wasm')
        rust.ensureClassRules(['block'])
        expect(rust.text).toBe('@layer utilities{.block{display:block}}')
      } finally {
        rust.dispose()
      }
    } finally {
      process.execArgv.splice(process.execArgv.lastIndexOf('--no-addons'), 1)
    }
  })

  it('does not hide expected native load failures behind the auto Wasm fallback', async () => {
    const bindingPath = process.env.MASTER_CSS_NATIVE_BINDING_PATH
    process.env.MASTER_CSS_NATIVE_BINDING_PATH = '/missing/master-css/mastercss.node'
    try {
      await expect(createEngine({ manifest, backend: 'auto' })).rejects.toMatchObject({
        name: 'MasterCSSEngineError',
        code: 'NATIVE_LOAD_FAILED'
      })
    } finally {
      if (bindingPath === undefined) {
        delete process.env.MASTER_CSS_NATIVE_BINDING_PATH
      } else {
        process.env.MASTER_CSS_NATIVE_BINDING_PATH = bindingPath
      }
    }
  })

  it('matches existing static, pattern, property, sorting, and escaping output', () => {
    const oracle = MasterCSS.create({ manifest })
    oracle.ensureClassRules('block', 'w:10px', 'bg-origin-border')

    const rust = createEngineSync({ manifest })
    const transition = rust.ensureClassRules(['block', 'w:10px', 'bg-origin-border'])

    expect(transition.mutations).toHaveLength(3)
    expect(rust.text).toBe(oracle.text)
  })

  it('keeps ensure idempotent and delete synchronous', () => {
    const rust = createEngineSync({ manifest })
    rust.ensureClassRules(['block', 'w:10px'])
    expect(rust.ensureClassRules(['block']).mutations).toEqual([])
    expect(rust.deleteClassRules(['block']).mutations).toHaveLength(1)
    expect(rust.text).toBe('@layer utilities{.w\\:10px{width:10px}}')
  })

  it('matches selector, condition, layer, important, and base-unit state', () => {
    const classNames = [
      'block:hover',
      'block:first',
      'block_button',
      'block@sm',
      'w:10px:hover@sm',
      'block@base',
      'block!',
      'w:1x'
    ]
    for (const className of classNames) {
      const oracle = MasterCSS.create({ manifest })
      oracle.ensureClassRules(className)
      const rust = createEngineSync({ manifest })
      rust.ensureClassRules([className])
      expect(rust.text, className).toBe(oracle.text)
      rust.dispose()
    }
  })

  it('matches deterministic cascade ordering for mixed utility batches', () => {
    const batches = [
      [
        'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
        'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
        'font:.75rem', 'font:medium', 'text-center', 'fixed', 'block', 'round', 'b:0'
      ],
      [
        'font:.75rem', 'font:2rem@md', 'font:1.5rem@sm', 'm:8x', 'block',
        'px:4x', 'bg:blue-60:hover', 'round', 'mb:12x'
      ],
      [
        'block@base', 'text-center@default', 'round@component', 'fixed@utility',
        '{flex-row}@xs', 'hidden@tablet&<desktop', '{flex-row}@2xs&<xs'
      ]
    ]

    for (const original of batches) {
      for (const classNames of [original, [...original].reverse()]) {
        const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
        oracle.ensureClassRules(...classNames)
        const rust = createEngineSync({ manifest: typedDefaultManifest })
        rust.ensureClassRules(classNames)
        expect(rust.text, classNames.join(' ')).toBe(oracle.text)
      }
    }
  })

  it('rejects use after dispose in the host adapter', () => {
    const rust = createEngineSync({ manifest })
    rust.dispose()
    expect(() => rust.snapshot()).toThrow('has been disposed')
  })

  it('preserves structured Rust errors across the native boundary', () => {
    expect(() => createEngineSync({
      manifest: { version: 2 } as unknown as MasterCSSManifest
    })).toThrowError(expect.objectContaining({
      name: 'MasterCSSEngineError',
      code: 'UNSUPPORTED_MANIFEST_VERSION'
    }))

    const rust = createEngineSync({ manifest })
    rust.ensureClassRules(['block'])
    const before = rust.text
    expect(() => rust.refresh({ version: 2 } as unknown as MasterCSSManifest))
      .toThrowError(expect.objectContaining({
        name: 'MasterCSSEngineError',
        code: 'UNSUPPORTED_MANIFEST_VERSION'
      }))
    expect(rust.text).toBe(before)
    expect(() => rust.refresh({ version: 2 } as unknown as MasterCSSManifest)).toThrow(MasterCSSEngineError)
  })

  it('inspects without mutating session state', () => {
    const rust = createEngineSync({ manifest })
    expect(rust.inspect('block:hover')).toMatchObject({
      version: 1,
      className: 'block:hover',
      valid: true
    })
    expect(rust.text).toBe('')
  })

  it('matches all directly representable default-manifest static and property classes', () => {
    const classNames = new Set<string>()
    for (const utility of typedDefaultManifest.utilities || []) {
      for (const matcher of utility.matchers) {
        if (matcher.type === 'static') {
          classNames.add(matcher.name)
        } else if (matcher.type === 'pattern' && matcher.values[0]) {
          classNames.add(matcher.prefix + matcher.values[0])
        } else if (matcher.type === 'key' && matcher.keys[0] && utility.emit.type === 'property') {
          classNames.add(`${matcher.keys[0]}:10px`)
        }
      }
    }

    const rust = createEngineSync({ manifest: typedDefaultManifest })
    for (const className of classNames) {
      const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
      oracle.ensureClassRules(className)
      rust.ensureClassRules([className])
      expect(rust.text, className).toBe(oracle.text)
      rust.deleteClassRules([className])
    }
    rust.dispose()
    expect(classNames.size).toBe(133)
  })

  it('matches manifest-declared variable, value, and key matcher samples', () => {
    const classNames = new Set<string>()
    for (const utility of typedDefaultManifest.utilities || []) {
      for (const matcher of utility.matchers) {
        if (matcher.type === 'variable') {
          for (const reference of utility.variableAliasRefs || []) {
            const namespace = reference.replace(/^[=~]/, '')
            const variable = typedDefaultManifest.variables?.[namespace]?.find(({ value }) => value !== false)
            if (!variable) continue
            for (const key of matcher.keys) classNames.add(`${key}:${variable.key}`)
            break
          }
        } else if (matcher.type === 'value') {
          const value = utility.kind === 'number'
            ? '10px'
            : utility.kind === 'color'
              ? '#abc'
              : utility.kind === 'image'
                ? 'url(x)'
                : undefined
          if (value) for (const key of matcher.keys) classNames.add(`${key}:${value}`)
        } else if (matcher.type === 'key') {
          for (const key of matcher.keys) classNames.add(`${key}:10px`)
        }
      }
    }

    const differences: { className: string, oracle: string, rust: string }[] = []
    const rust = createEngineSync({ manifest: typedDefaultManifest })
    try {
      for (const className of classNames) {
        const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
        oracle.ensureClassRules(className)
        rust.ensureClassRules([className])
        if (rust.text !== oracle.text) {
          differences.push({ className, oracle: oracle.text, rust: rust.text })
        }
        rust.deleteClassRules([className])
      }
    } finally {
      rust.dispose()
    }
    expect(differences).toEqual([])
    expect(classNames.size).toBeGreaterThan(40)
  })

  it('matches every builtin key alias through native-value fallback', () => {
    const differences: { className: string, oracle: string, rust: string }[] = []
    const rust = createEngineSync({ manifest: typedDefaultManifest })
    for (const key of Object.keys(builtinKeyAliases)) {
      const className = `${key}:10px`
      const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
      oracle.ensureClassRules(className)
      rust.ensureClassRules([className])
      if (rust.text !== oracle.text) {
        differences.push({ className, oracle: oracle.text, rust: rust.text })
      }
      rust.deleteClassRules([className])
    }
    rust.dispose()
    expect(differences).toEqual([])
    expect(Object.keys(builtinKeyAliases).length).toBeGreaterThan(90)
  })

  it('matches representative native namespaces, aliases, and compound values', () => {
    const classNames = [
      'ml:4x', 'mr:4x', 'mt:4x', 'mb:4x', 'm:4x', 'mx:4x', 'my:4x',
      'padding:4x', 'gap:4x', 'flex-basis:2x', 'flex-basis:sm', 'r:md',
      'rtl:md', 'rtr:md', 'rbl:md', 'rbr:md', 'size-x:md', 'size-y:md',
      'min-size-x:4x', 'min-size-y:4x', 'max-size-x:4x', 'max-size-y:4x',
      'scroll-mx:4x', 'scroll-mxs:4x', 'scroll-mxe:4x', 'scroll-py:4x',
      'gap-x:4x', 'gap-y:4x', 'b:blue-50|1px|solid', 'bl:1px|solid|blue-50',
      'bx:1px|solid', 'by:1px|solid', 'bg:conic-gradient(current,black)'
    ]
    const differences: { className: string, oracle: string, rust: string }[] = []
    const rust = createEngineSync({ manifest: typedDefaultManifest })
    try {
      for (const className of classNames) {
        const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
        oracle.ensureClassRules(className)
        rust.ensureClassRules([className])
        if (rust.text !== oracle.text) {
          differences.push({ className, oracle: oracle.text, rust: rust.text })
        }
        rust.deleteClassRules([className])
      }
    } finally {
      rust.dispose()
    }
    expect(differences).toEqual([])
  })

  it('matches representative parser, function, alpha, condition, and selector cases', () => {
    const classNames = [
      'bg:black', 'bg:light-dark(#000,#fff)', 'bg:#fff', 'bg:transparent', 'bg:current',
      'bg:url("#test")', 'bg:linear-gradient(45deg,#f3ec78,#af4261)',
      'bg:black:hover@md&landscape', 'stroke:.75', 'stroke:red', 'shape-margin:1px',
      'text-underline:sm', 'text-stroke-width:1px', 'user-select:none', 'line-clamp:none',
      'w:calc(var(--h)|/|var(--w)*100%)', 'w:calc(-2px+var(--spacing-md))',
      'w:calc(-var(--spacing-md)-2px)', 'w:calc(-1*(var(--spacing-md)*2)*3-2px)',
      'font-weight:var(--font-weight-thin)', 'fg:$color-white/.5', 'bg:neutral-30/.5',
      'grid-cols:3', 'line-clamp:3', 'text:2xl', 'm:-md', 'mt:-md', 'translate:-md',
      'w:-sm', 'block@sm&<md', 'block@<md', 'pb:8x:not(:last)',
      'block@media(pointer:coarse)', 'block@h<sm', 'block@h>=sm&h<lg',
      'block@!sm', 'block@only(print)', 'block@!(screen&(any-hover:hover))',
      'block@<sm,>=lg', 'block@starting-style',
      'bg:blue-20:hover:not(.active)', 'text-center_td:not(:first)', 'flex@sm',
      'bg:transparent_:is(.monaco-editor,.monaco-editor-background,.monaco-editor_.margin)',
      'grid-col-span:2', 'top:5x', 'bottom:2.5x',
      'right:max(0px,calc(50%-45.3125rem))', 'max-w:3xs', 'max-w:16px',
      'touch-action:none', 'view-transition-name:hero',
      'opacity:0.5::view-transition-old(hero)', 'opacity:1::view-transition-new(hero)',
      'translate:16px|24px', 'scale:1.5|2', 'rotate:45deg',
      'transform:translate(16px,16px)', 'border-inline-start-width:2px',
      'border-start-start-radius:2x', 'font-size:clamp(1.5rem,2vw+1rem,2.25rem)',
      'filter:drop-shadow(0|2px|4px|black/.2)'
    ]
    const differences: { className: string, oracle: string, rust: string }[] = []
    const rust = createEngineSync({ manifest: typedDefaultManifest })
    try {
      for (const className of classNames) {
        const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
        oracle.ensureClassRules(className)
        rust.ensureClassRules([className])
        if (rust.text !== oracle.text) {
          differences.push({ className, oracle: oracle.text, rust: rust.text })
        }
        rust.deleteClassRules([className])
      }
    } finally {
      rust.dispose()
    }
    expect(differences).toEqual([])
  })

  it('matches grouped declaration lowering and nested utility resolution', () => {
    const classNames = [
      '{color:black!;bb:2px|solid}',
      '{pt:calc(2.5em+3.75rem);mt:-3.75rem}_:where(h1,h2,h3,h4,h5,h6)',
      '{line-height:calc(32-16);font-size:calc(2rem-1rem)}',
      '{m:8x;leading:1.5}',
      '{form}',
      '{form;block}'
    ]
    for (const className of classNames) {
      const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
      oracle.ensureClassRules(className)
      const rust = createEngineSync({ manifest: typedDefaultManifest })
      rust.ensureClassRules([className])
      expect(rust.text, className).toBe(oracle.text)
    }

    const importantManifest = structuredClone(typedDefaultManifest)
    importantManifest.settings = { ...importantManifest.settings, important: true }
    const oracle = MasterCSS.create({ manifest: importantManifest })
    oracle.ensureClassRules('{color:black!;bb:2px|solid}')
    const rust = createEngineSync({ manifest: importantManifest })
    rust.ensureClassRules(['{color:black!;bb:2px|solid}'])
    expect(rust.text).toBe(oracle.text)

    const branchedManifest = structuredClone(typedDefaultManifest)
    branchedManifest.variants = [
      ...(branchedManifest.variants || []),
      {
        token: ':hocus',
        branches: [
          { selector: '&:hover' },
          { selector: '&:focus' }
        ]
      }
    ]
    const branchedClasses = [
      '{block;fg:red-60}:hocus',
      '{animate:fade;bg:red-60}:hocus@sm'
    ]
    const branchedOracle = MasterCSS.create({ manifest: branchedManifest })
    branchedOracle.ensureClassRules(...branchedClasses)
    const branchedRust = createEngineSync({ manifest: branchedManifest })
    branchedRust.ensureClassRules(branchedClasses)
    expect(branchedRust.text).toBe(branchedOracle.text)
  })

  it('matches default-manifest variable aliases, base units, ordering, and resource retention', () => {
    for (const className of [
      'm:1x',
      'm:md',
      'w:md',
      'fg:red-60',
      'bg:red-60',
      '{content:``;block;h:full;w:full;abs}::after'
    ]) {
      const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
      oracle.ensureClassRules(className)
      const rust = createEngineSync({ manifest: typedDefaultManifest })
      rust.ensureClassRules([className])
      expect(rust.text, className).toBe(oracle.text)
      rust.dispose()
    }

    const classNames = ['fg:red-60', 'bg:red-60', 'm:md']
    const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
    oracle.ensureClassRules(...classNames)
    const rust = createEngineSync({ manifest: typedDefaultManifest })
    rust.ensureClassRules(classNames)
    expect(rust.text).toBe(oracle.text)

    oracle.deleteClassRules('fg:red-60')
    rust.deleteClassRules(['fg:red-60'])
    expect(rust.text).toBe(oracle.text)

    oracle.deleteClassRules('bg:red-60', 'm:md')
    rust.deleteClassRules(['bg:red-60', 'm:md'])
    expect(rust.text).toBe(oracle.text)
  })

  it('suppresses theme variables declared through emittedGlobals', () => {
    const emittedGlobals = { variables: { 'color-red-60': 1 } }
    const oracle = MasterCSS.create({
      manifest: typedDefaultManifest,
      emittedGlobals
    })
    const rust = createEngineSync({
      manifest: typedDefaultManifest,
      emittedGlobals
    })

    oracle.ensureClassRules('bg:red-60')
    rust.ensureClassRules(['bg:red-60'])
    expect(rust.text).toBe(oracle.text)

    oracle.deleteClassRules('bg:red-60')
    rust.deleteClassRules(['bg:red-60'])
    expect(rust.text).toBe(oracle.text)
  })

  it('matches mode-variable buckets for media, class, and host triggers', () => {
    for (const modeTrigger of ['media', 'class', 'host'] as const) {
      const modeManifest = structuredClone(typedDefaultManifest)
      modeManifest.settings = {
        ...modeManifest.settings,
        modeTrigger,
        defaultMode: 'light'
      }
      const oracle = MasterCSS.create({ manifest: modeManifest })
      oracle.ensureClassRules('surface:base', 'text:body')
      const rust = createEngineSync({ manifest: modeManifest })
      rust.ensureClassRules(['surface:base', 'text:body'])
      expect(rust.text, modeTrigger).toBe(oracle.text)
    }
  })

  it('matches keyframe lifecycle and emitted animation suppression', () => {
    const oracle = MasterCSS.create({ manifest: typedDefaultManifest })
    const rust = createEngineSync({ manifest: typedDefaultManifest })
    oracle.ensureClassRules('animate:fade')
    rust.ensureClassRules(['animate:fade'])
    expect(rust.text).toBe(oracle.text)
    oracle.deleteClassRules('animate:fade')
    rust.deleteClassRules(['animate:fade'])
    expect(rust.text).toBe(oracle.text)

    const emittedGlobals = { animations: { fade: 1 } }
    const emittedOracle = MasterCSS.create({
      manifest: typedDefaultManifest,
      emittedGlobals
    })
    const emittedRust = createEngineSync({
      manifest: typedDefaultManifest,
      emittedGlobals
    })
    emittedOracle.ensureClassRules('animate:fade')
    emittedRust.ensureClassRules(['animate:fade'])
    expect(emittedRust.text).toBe(emittedOracle.text)
  })
})
