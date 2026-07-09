import { describe, expect, test } from 'vitest'
import { MasterCSS } from '../src'
import {
  createCSSWithSemanticUtilities,
  createCSSWithVariables,
  createDefaultCSS,
  cloneManifest,
  createManifestWithSemanticUtilities,
  expectClassText,
  expectLayerText
} from './helpers/css-tester'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import UtilityType from '@master/css-schema/utility-type'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

describe.concurrent('default manifest utility parity', () => {
  test('generates representative background utilities', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'bg:black', 'background-color:oklch(0% 0 none)')
    expectClassText(css, 'bg:light-dark(#000,#fff)', 'background-color:light-dark(#000,#fff)')
    expectClassText(css, 'bg:#fff', 'background-color:#fff')
    expect(css.createRule('bg:black:hover@md&landscape')?.text)
      .toBe('@media (width>=64rem) and (orientation:landscape){.bg\\:black\\:hover\\@md\\&landscape:hover{background-color:oklch(0% 0 none)}}')
    expectClassText(css, 'bg:transparent', 'background-color:transparent')
    expectClassText(css, 'bg:current', 'background-color:currentColor')
    expectClassText(css, 'bg-clip-border', 'background-clip:border-box')
    expectClassText(css, 'bg:url("#test")', 'background-image:url("#test")')
    expectClassText(css, 'bg:linear-gradient(45deg,#f3ec78,#af4261)', 'background-image:linear-gradient(45deg,#f3ec78,#af4261)')
  })

  test('keeps gradient color token functions as resolved color values', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'bg:conic-gradient(current,black)', 'background-image:conic-gradient(currentColor,oklch(0% 0 none))')
    expectClassText(css, 'bg:linear-gradient(current,black)', 'background-image:linear-gradient(currentColor,oklch(0% 0 none))')
    expectClassText(css, 'bg:radial-gradient(current,black)', 'background-image:radial-gradient(currentColor,oklch(0% 0 none))')
    expectClassText(css, 'bg:repeating-linear-gradient(current,black)', 'background-image:repeating-linear-gradient(currentColor,oklch(0% 0 none))')
    expectClassText(css, 'bg:repeating-radial-gradient(current,black)', 'background-image:repeating-radial-gradient(currentColor,oklch(0% 0 none))')
  })

  test('preserves margin aliases and priority order', () => {
    const css = createDefaultCSS()
    expectClassText(css, 'ml:4x', 'margin-left:1rem')
    expectClassText(css, 'mr:4x', 'margin-right:1rem')
    expectClassText(css, 'mt:4x', 'margin-top:1rem')
    expectClassText(css, 'mb:4x', 'margin-bottom:1rem')
    expectClassText(css, 'm:4x', 'margin:1rem')
    expectClassText(css, 'm:1px', 'margin:1px')
    expectClassText(css, 'mx:4x', 'margin-inline:1rem')
    expectClassText(css, 'my:4x', 'margin-block:1rem')

    css.ensureClassRules('mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0')
    expect(css.utilitiesLayer.rules.map(({ name }) => name))
      .toEqual(['m:0', 'mx:0', 'my:0', 'mb:0', 'ml:0', 'mr:0', 'mt:0'])
  })

  test('resolves native value namespaces with aliases tokens and validation', () => {
    const css = MasterCSS.create({
      manifest: defaultManifest,
      nativeDeclarationMatcher: ({ property, value }) =>
        property === 'width' && (value === '1rem' || value === 'var(--container-sm)')
        || property === 'margin' && value === '1rem'
        || property === 'margin-top' && value === '1rem'
        || property === 'padding' && value === '1rem'
        || property === 'gap' && value === '1rem'
        || property === 'flex-basis' && (value === '0.5rem' || value === 'var(--container-sm)')
        || property === 'border-radius' && value === 'var(--radius-md)'
    })

    expect(css.createRule('width:4x')?.text).toBe('.width\\:4x{width:1rem}')
    expect(css.createRule('w:4x')?.text).toBe('.w\\:4x{width:1rem}')
    expect(css.createRule('width:sm')?.text).toBe('.width\\:sm{width:var(--container-sm)}')
    expect(css.createRule('w:sm')?.text).toBe('.w\\:sm{width:var(--container-sm)}')
    expect(css.createRule('margin:4x')?.text).toBe('.margin\\:4x{margin:1rem}')
    expect(css.createRule('mt:4x')?.text).toBe('.mt\\:4x{margin-top:1rem}')
    expect(css.createRule('padding:4x')?.text).toBe('.padding\\:4x{padding:1rem}')
    expect(css.createRule('gap:4x')?.text).toBe('.gap\\:4x{gap:1rem}')
    expect(css.createRule('flex-basis:2x')?.text).toBe('.flex-basis\\:2x{flex-basis:0.5rem}')
    expect(css.createRule('flex-basis:sm')?.text).toBe('.flex-basis\\:sm{flex-basis:var(--container-sm)}')
    expect(css.createRule('r:md')?.text).toBe('.r\\:md{border-radius:var(--radius-md)}')
    expect(css.createRule('width:block')).toBeUndefined()
  })

  test('prefers raw managed dynamic utilities before native and semantic fallbacks', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'stroke:.75', 'stroke-width:0.75')
    expectClassText(css, 'stroke:red', 'stroke:var(--color-red)')
    expectClassText(css, 'shape-margin:1px', 'shape-margin:1px')
    expectClassText(css, 'text-underline:sm', 'text-underline-offset:var(--spacing-sm)')
    expectClassText(css, 'text-stroke-width:1px', '-webkit-text-stroke-width:1px')
    expectClassText(css, 'user-select:none', '-webkit-user-select:none')
    expectClassText(css, 'line-clamp:none', '-webkit-line-clamp:none')
    expectClassText(css, 'text-center:hover', 'text-align:center')
  })

  test('drops colliding shorthand token aliases', () => {
    const css = MasterCSS.create({ manifest: defaultManifest })
    const nativeCSS = MasterCSS.create({
      manifest: defaultManifest,
      nativeDeclarationMatcher: ({ property }) =>
        property === 'background'
        || property === 'container'
        || property === 'flex'
    })

    expect(css.createRule('background:red')).toBeUndefined()
    expect(css.createRule('background:sm')).toBeUndefined()
    expect(css.createRule('container:sm')?.text).not.toContain('var(--container-sm)')
    expect(css.createRule('flex:sm')?.text).not.toContain('flex-basis')
    expect(css.createRule('flex:md')?.text).not.toContain('flex-basis')
    expect(nativeCSS.createRule('background:red')?.text).toBe('.background\\:red{background:red}')
    expect(nativeCSS.createRule('container:inline-size')?.text).toBe('.container\\:inline-size{container:inline-size}')
    expect(nativeCSS.createRule('flex:0|0|auto')?.text).toBe('.flex\\:0\\|0\\|auto{flex:0 0 auto}')
  })

  test('preserves radius corner aliases through key aliases', () => {
    const css = createDefaultCSS()

    expect(css.createRule('rt:4x')).toBeUndefined()
    expect(css.createRule('rb:4x')).toBeUndefined()
    expect(css.createRule('rl:4x')).toBeUndefined()
    expect(css.createRule('rr:4x')).toBeUndefined()
    expect(css.createRule('rtl:md')?.text)
      .toBe('.rtl\\:md{border-top-left-radius:var(--radius-md)}')
    expect(css.createRule('rtr:md')?.text)
      .toBe('.rtr\\:md{border-top-right-radius:var(--radius-md)}')
    expect(css.createRule('rbl:md')?.text)
      .toBe('.rbl\\:md{border-bottom-left-radius:var(--radius-md)}')
    expect(css.createRule('rbr:md')?.text)
      .toBe('.rbr\\:md{border-bottom-right-radius:var(--radius-md)}')
  })

  test('preserves border shorthand matching across value separators', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'bl:blue-50|1px|solid', 'border-left:var(--color-blue-50) 1px solid')
    expectClassText(css, 'border-left:blue-50|1px|solid', 'border-left:var(--color-blue-50) 1px solid')
    expectClassText(css, 'b:blue-50|1px|solid', 'border:var(--color-blue-50) 1px solid')
    expectClassText(css, 'bt:blue-50|1px|solid', 'border-top:var(--color-blue-50) 1px solid')
    expectClassText(css, 'br:blue-50|1px|solid', 'border-right:var(--color-blue-50) 1px solid')
    expectClassText(css, 'bb:blue-50|1px|solid', 'border-bottom:var(--color-blue-50) 1px solid')
    expectClassText(css, 'border-inline:blue-50|1px|solid', 'border-inline:var(--color-blue-50) 1px solid')
    expectClassText(css, 'border-block:blue-50|1px|solid', 'border-block:var(--color-blue-50) 1px solid')
    expectClassText(css, 'bl:1px|solid|blue-50', 'border-left:1px solid var(--color-blue-50)')
  })

  test('keeps border single-value aliases on color and width utilities with static style utilities', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'bl:blue-50', 'border-left-color:var(--color-blue-50)')
    expectClassText(css, 'border-left-width:1px', 'border-left-width:1px')
    expectClassText(css, 'bl-solid', 'border-left-style:solid')
  })

  test('supports native axis shorthand aliases alongside logical replacements', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'mx:4x', 'margin-inline:1rem')
    expectClassText(css, 'mxs:4x', 'margin-inline-start:1rem')
    expectClassText(css, 'mxe:4x', 'margin-inline-end:1rem')
    expectClassText(css, 'my:4x', 'margin-block:1rem')
    expectClassText(css, 'mys:4x', 'margin-block-start:1rem')
    expectClassText(css, 'mye:4x', 'margin-block-end:1rem')
    expectClassText(css, 'margin-block:4x', 'margin-block:1rem')
    expectClassText(css, 'px:4x', 'padding-inline:1rem')
    expectClassText(css, 'pxs:4x', 'padding-inline-start:1rem')
    expectClassText(css, 'pxe:4x', 'padding-inline-end:1rem')
    expectClassText(css, 'py:4x', 'padding-block:1rem')
    expectClassText(css, 'pys:4x', 'padding-block-start:1rem')
    expectClassText(css, 'pye:4x', 'padding-block-end:1rem')
    expectClassText(css, 'padding-block:4x', 'padding-block:1rem')
    expectClassText(css, 'ix:4x', 'inset-inline:1rem')
    expectClassText(css, 'ixs:4x', 'inset-inline-start:1rem')
    expectClassText(css, 'ixe:4x', 'inset-inline-end:1rem')
    expectClassText(css, 'iy:4x', 'inset-block:1rem')
    expectClassText(css, 'iys:4x', 'inset-block-start:1rem')
    expectClassText(css, 'iye:4x', 'inset-block-end:1rem')
    expectClassText(css, 'size-x:md', 'inline-size:var(--container-md)')
    expectClassText(css, 'size-y:md', 'block-size:var(--container-md)')
    expectClassText(css, 'min-size-x:4x', 'min-inline-size:1rem')
    expectClassText(css, 'min-size-y:4x', 'min-block-size:1rem')
    expectClassText(css, 'max-size-x:4x', 'max-inline-size:1rem')
    expectClassText(css, 'max-size-y:4x', 'max-block-size:1rem')
    expectClassText(css, 'bx:1px|solid', 'border-inline:1px solid')
    expectClassText(css, 'border-inline:1px|solid', 'border-inline:1px solid')
    expectClassText(css, 'by:1px|solid', 'border-block:1px solid')
    expectClassText(css, 'border-block:1px|solid', 'border-block:1px solid')
    expectClassText(css, 'b:1px', 'border-width:1px')
    expectClassText(css, 'bx:1px', 'border-inline-width:1px')
    expectClassText(css, 'by:1px', 'border-block-width:1px')
    expectClassText(css, 'b:line', 'border:line')
    expectClassText(css, 'bx:line', 'border-inline:line')
    expectClassText(css, 'by:line', 'border-block:line')
    expectClassText(css, 'b:gray-20', 'border-color:var(--color-gray-20)')
    expectClassText(css, 'bx:gray-20', 'border-inline-color:var(--color-gray-20)')
    expectClassText(css, 'by:gray-20', 'border-block-color:var(--color-gray-20)')
    expectClassText(css, 'gap-x:4x', 'column-gap:1rem')
    expectClassText(css, 'column-gap:4x', 'column-gap:1rem')
    expectClassText(css, 'gap-y:4x', 'row-gap:1rem')
    expectClassText(css, 'row-gap:4x', 'row-gap:1rem')
    expectClassText(css, 'scroll-mx:4x', 'scroll-margin-inline:1rem')
    expectClassText(css, 'scroll-mxs:4x', 'scroll-margin-inline-start:1rem')
    expectClassText(css, 'scroll-mxe:4x', 'scroll-margin-inline-end:1rem')
    expectClassText(css, 'scroll-margin-inline:4x', 'scroll-margin-inline:1rem')
    expectClassText(css, 'scroll-my:4x', 'scroll-margin-block:1rem')
    expectClassText(css, 'scroll-mys:4x', 'scroll-margin-block-start:1rem')
    expectClassText(css, 'scroll-mye:4x', 'scroll-margin-block-end:1rem')
    expectClassText(css, 'scroll-margin-block:4x', 'scroll-margin-block:1rem')
    expectClassText(css, 'scroll-px:4x', 'scroll-padding-inline:1rem')
    expectClassText(css, 'scroll-pxs:4x', 'scroll-padding-inline-start:1rem')
    expectClassText(css, 'scroll-pxe:4x', 'scroll-padding-inline-end:1rem')
    expectClassText(css, 'scroll-padding-inline:4x', 'scroll-padding-inline:1rem')
    expectClassText(css, 'scroll-py:4x', 'scroll-padding-block:1rem')
    expectClassText(css, 'scroll-pys:4x', 'scroll-padding-block-start:1rem')
    expectClassText(css, 'scroll-pye:4x', 'scroll-padding-block-end:1rem')
    expectClassText(css, 'scroll-padding-block:4x', 'scroll-padding-block:1rem')
    expectClassText(css, 'bx-solid', 'border-inline-style:solid')
    expectClassText(css, 'border-inline-style:solid', 'border-inline-style:solid')
    expectClassText(css, 'by-solid', 'border-block-style:solid')
    expectClassText(css, 'border-block-style:solid', 'border-block-style:solid')

    for (const legacyAliasClass of [
      'mi:4x', 'mis:4x', 'mie:4x', 'mbs:4x', 'mbe:4x',
      'pi:4x', 'pis:4x', 'pie:4x', 'pbs:4x', 'pbe:4x',
      'ii:4x', 'iis:4x', 'iie:4x', 'ib:4x', 'ibs:4x', 'ibe:4x',
      'is:md', 'bs:md', 'min-is:4x', 'min-bs:4x', 'max-is:4x', 'max-bs:4x',
      'scroll-ms:4x', 'scroll-me:4x', 'scroll-mbs:4x', 'scroll-mbe:4x',
      'scroll-ps:4x', 'scroll-pe:4x', 'scroll-pbs:4x', 'scroll-pbe:4x'
    ]) {
      expect(css.createRule(legacyAliasClass), legacyAliasClass).toBeUndefined()
    }
  })

  test('executes compiled value functions and complex utilities', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'w:calc(var(--h)|/|var(--w)*100%)', 'width:calc(var(--h) / var(--w) * 100%)')
    expectClassText(css, 'w:calc(-2px+var(--spacing-md))', 'width:calc(-2px + var(--spacing-md))')
    expectClassText(css, 'w:calc(-var(--spacing-md)-2px)', 'width:calc(-var(--spacing-md) - 2px)')
    expectClassText(css, 'w:calc(-1*(var(--spacing-md)*2)*3-2px)', 'width:calc(-1 * (var(--spacing-md) * 2) * 3 - 2px)')
    expectClassText(css, 'font-weight:var(--font-weight-thin)', 'font-weight:var(--font-weight-thin)')
    expectClassText(css, 'fg:$color-white/.5', 'color:color-mix(in oklab,oklch(100% 0 none) 50%,transparent)')
    expectClassText(css, 'grid-cols:3', 'grid-template-columns:repeat(3, minmax(0, 1fr))')
    expectClassText(css, 'line-clamp:3', '-webkit-line-clamp:3')
    expectClassText(css, 'text:2xl', 'font-size:var(--font-size-2xl)')
  })

  test('resolves negative numeric aliases without synthetic variables', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'm:-md', 'margin:calc(var(--spacing-md) * -1)')
    expectClassText(css, 'mt:-md', 'margin-top:calc(var(--spacing-md) * -1)')
    expectClassText(css, 'translate:-md', 'translate:calc(var(--spacing-md) * -1)')
    expectClassText(css, 'w:-sm', 'width:calc(var(--container-sm) * -1)')
    expect(css.createRule('m:-md')?.variableNames).toEqual(new Set(['spacing-md']))
    expect(css.createRule('fg:-black')?.text).not.toContain('var(--color-black)')
  })

  test('keeps unitful numeric variables from receiving a second unit conversion', () => {
    const css = createCSSWithVariables([
      { name: 'spacing-card', namespace: 'spacing', key: 'card', type: 'number', value: '1.5rem', numeric: { value: 1.5, unit: 'rem' } },
      { name: 'container-card', namespace: 'container', key: 'card', type: 'number', value: '32rem', numeric: { value: 32, unit: 'rem' } }
    ])

    expectClassText(css, 'm:card', 'margin:var(--spacing-card)')
    expectClassText(css, 'm:-card', 'margin:calc(var(--spacing-card) * -1)')
    expectClassText(css, 'w:card', 'width:var(--container-card)')
    expectClassText(css, 'w:calc(var(--spacing-card)+2px)', 'width:calc(var(--spacing-card) + 2px)')
    expect(css.createRule('m:card')?.variableNames).toEqual(new Set(['spacing-card']))
  })

  test('uses compiled breakpoint aliases from the default manifest', () => {
    expect(createDefaultCSS().createRule('block@sm&<md')?.text)
      .toContain('@media (width>=52.125rem) and (width<64rem)')
    expect(createDefaultCSS().createRule('block@<md')?.text)
      .toContain('@media (width<64rem)')
  })

  test('keeps functional pseudo-class selector arguments intact', () => {
    const css = createDefaultCSS()

    expect(css.createRule('pb:8x:not(:last)')?.text)
      .toBe('.pb\\:8x\\:not\\(\\:last\\):not(:last-child){padding-bottom:2rem}')
    expect(css.createRule('bg:blue-20:hover:not(.active)')?.text)
      .toBe('.bg\\:blue-20\\:hover\\:not\\(\\.active\\):hover:not(.active){background-color:var(--color-blue-20)}')
    expect(css.createRule('text-center_td:not(:first)')?.text)
      .toBe('.text-center_td\\:not\\(\\:first\\) td:not(:first-child){text-align:center}')
  })

  test('preserves migrated representative default utility cases', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'animation-direction:normal', 'animation-direction:normal')
    expect(css.createRule('@direction:normal')).toBeUndefined()
    expect(css.createRule('flex@sm')?.text)
      .toBe('@media (width>=52.125rem){.flex\\@sm{display:flex}}')
    expectClassText(css, 'grid-col-span:2', 'grid-column:span 2/span 2')
    expect(css.createRule('grid-column-span:2')).toBeUndefined()
    expectClassText(css, 'top:5x', 'top:1.25rem')
    expectClassText(css, 'bottom:2.5x', 'bottom:0.625rem')
    expectClassText(css, 'right:max(0px,calc(50%-45.3125rem))', 'right:max(0px,calc(50% - 45.3125rem))')
    expectClassText(css, 'max-w:3xs', 'max-width:var(--container-3xs)')
    expectClassText(css, 'max-w:16px', 'max-width:16px')
    expect(css.createRule('size:4x')?.declarations).toStrictEqual({ width: '1rem', height: '1rem' })
    expect(css.createRule('size:md')?.declarations).toStrictEqual({
      width: 'var(--container-md)',
      height: 'var(--container-md)'
    })
    expect(css.createRule('max:4x')?.declarations).toStrictEqual({ 'max-width': '1rem', 'max-height': '1rem' })
    expect(css.createRule('min:4x')?.declarations).toStrictEqual({ 'min-width': '1rem', 'min-height': '1rem' })
  })

  test('rejects variable function syntax', () => {
    const css = createDefaultCSS()

    expect(css.createRule('w:$(spacing-md)')).toBeUndefined()
    expect(css.createRule('w:$(spacing-md,1rem)')).toBeUndefined()
    expect(css.createRule('w:calc($(spacing-md)+2px)')).toBeUndefined()
  })

  test('keeps grouped declaration parsing and nested generated utilities', () => {
    const css = createDefaultCSS()

    expect(css.createRule('{color:black!;bb:2px|solid}')?.declarations)
      .toStrictEqual({ color: 'oklch(0% 0 none)!important', 'border-bottom': '2px solid' })
    expect(css.createRule('{pt:calc(2.5em+3.75rem);mt:-3.75rem}_:where(h1,h2,h3,h4,h5,h6)')?.declarations)
      .toStrictEqual({ 'padding-top': 'calc(2.5em + 3.75rem)', 'margin-top': '-3.75rem' })
    expect(css.createRule('{line-height:calc(32-16);font-size:calc(2rem-1rem)}')?.declarations)
      .toStrictEqual({ 'line-height': 'calc(32 - 16)', 'font-size': 'calc(2rem - 1rem)' })
    expect(css.createRule('{m:8x;leading:1.5}')?.declarations)
      .toStrictEqual({ margin: '2rem', 'line-height': '1.5' })
    expect(css.createRule('{form}')?.text).toBe('')
    expect(css.createRule('{form;block}')?.declarations).toStrictEqual({ display: 'block' })
  })

  test('keeps grouped declarations important when configured globally', () => {
    const manifest = cloneManifest()
    manifest.settings = {
      ...(manifest.settings || {}),
      important: true
    }

    expect(MasterCSS.create({ manifest: manifest }).createRule('{color:black!;bb:2px|solid}')?.declarations)
      .toStrictEqual({ color: 'oklch(0% 0 none)!important', 'border-bottom': '2px solid!important' })
    expect(MasterCSS.create({ manifest: manifest }).createRule('{color:black!;bb:2px|solid}')?.text)
      .toContain('border-bottom:2px solid!important')
  })

  test('keeps migrated issue regressions for modern utility syntax', () => {
    const css = createDefaultCSS()

    expectClassText(css, 'touch-action:none', 'touch-action:none')
    expectClassText(css, 'view-transition-name:hero', 'view-transition-name:hero')
    expect(css.createRule('touch:none')).toBeUndefined()
    expect(css.createRule('vt-name:hero')).toBeUndefined()
    expect(css.createRule('opacity:0.5::view-transition-old(hero)')?.text)
      .toContain('::view-transition-old(hero)')
    expect(css.createRule('opacity:1::view-transition-new(hero)')?.text)
      .toContain('::view-transition-new(hero)')
    expectClassText(css, 'translate:16px|24px', 'translate:16px 24px')
    expectClassText(css, 'scale:1.5|2', 'scale:1.5 2')
    expectClassText(css, 'rotate:45deg', 'rotate:45deg')
    expectClassText(css, 'transform:translate(16px,16px)', 'transform:translate(16px,16px)')
    expectClassText(css, 'border-inline-start-width:2px', 'border-inline-start-width:2px')
    expectClassText(css, 'border-start-start-radius:2x', 'border-start-start-radius:0.5rem')
    expect(css.createRule('font-size:clamp(1.5rem,2vw+1rem,2.25rem)')?.text)
      .toMatch(/font-size:clamp\(1\.5rem,\s*calc\(2vw \+ 1rem\),\s*2\.25rem\)/)
    expect(css.createRule('{paint-order:stroke|fill|markers}')?.text)
      .toContain('paint-order:stroke fill markers')
  })

  test('does not support bare function utilities', () => {
    const css = createDefaultCSS()

    for (const className of [
      'scale(1.1)',
      'rotate(45deg)',
      'translate(16px,16px)',
      'blur(4px)',
      'drop-shadow(0|2px|4px|black/.2)',
      'gradient(45deg,#f3ec78,#af4261)'
    ]) {
      expect(css.createRule(className), className).toBeUndefined()
    }

    expectClassText(css, 'transform:scale(1.1)', 'transform:scale(1.1)')
    expectClassText(css, 'transform:rotate(45deg)', 'transform:rotate(45deg)')
    expectClassText(css, 'transform:translate(16px,16px)', 'transform:translate(16px,16px)')
    expectClassText(css, 'filter:blur(4px)', 'filter:blur(4px)')
    expectClassText(css, 'filter:drop-shadow(0|2px|4px|black/.2)', 'filter:drop-shadow(0 2px 4px color-mix(in oklab,oklch(0% 0 none) 20%,transparent))')
    expectClassText(css, 'bg:linear-gradient(45deg,#f3ec78,#af4261)', 'background-image:linear-gradient(45deg,#f3ec78,#af4261)')
  })

  test('removes legacy css variable assignment shorthand while keeping native custom property fallback opt-in', () => {
    const css = MasterCSS.create({ manifest: defaultManifest })

    expect(css.createRule('$foo:123')).toBeUndefined()
    expect(css.createRule('$foo:123:hover')).toBeUndefined()
    expect(css.createRule('$foo:123@sm')).toBeUndefined()
    expect(css.createRule('--foo:123')).toBeUndefined()

    const nativeCSS = MasterCSS.create({
      manifest: defaultManifest,
      nativeDeclarationMatcher: () => false
    })

    expect(nativeCSS.createRule('$foo:123')).toBeUndefined()
    expect(nativeCSS.createRule('--foo:123')?.text).toContain('{--foo:123}')
    expect(nativeCSS.createRule('--foo:123:hover')?.text).toContain(':hover{--foo:123}')
  })

  test('uses injected native declaration matcher after manifest misses and rejects removed aliases', () => {
    const css = MasterCSS.create({
      manifest: defaultManifest,
      nativeDeclarationMatcher: ({ property, value }) =>
        property === 'float' && value === 'left'
        || property === 'display' && value === 'block'
        || property === 'field-sizing' && value === 'content'
        || property === 'align-items' && value === 'center'
        || property === 'mix-blend-mode' && value === 'multiply'
        || property === 'columns' && value === '2'
        || property === 'view-transition-name' && value === 'hero'
    })

    expect(css.createRule('float:left')?.text).toBe('.float\\:left{float:left}')
    expect(css.createRule('field-sizing:content:hover')?.text).toBe('.field-sizing\\:content\\:hover:hover{field-sizing:content}')
    expect(css.createRule('display:block')?.text).toBe('.display\\:block{display:block}')
    expect(css.createRule('align-items:center')?.text).toBe('.align-items\\:center{align-items:center}')
    expect(css.createRule('mix-blend-mode:multiply')?.text).toBe('.mix-blend-mode\\:multiply{mix-blend-mode:multiply}')
    expect(css.createRule('columns:2')?.text).toBe('.columns\\:2{columns:2}')
    expect(css.createRule('view-transition-name:hero')?.text).toBe('.view-transition-name\\:hero{view-transition-name:hero}')
    expect(css.createRule('float:banana')).toBeUndefined()
    expect(css.createRule('display:banana')).toBeUndefined()
    expect(css.createRule('d:banana')).toBeUndefined()
    expect(css.createRule('d:block')).toBeUndefined()
    expect(css.createRule('ai:center')).toBeUndefined()
    expect(css.createRule('blend:multiply')).toBeUndefined()
    expect(css.createRule('cols:2')).toBeUndefined()
    expect(css.createRule('vt-name:hero')).toBeUndefined()
    expect(css.createRule('made-up:left')).toBeUndefined()
  })

  test('uses native declaration fast path without bypassing aliases and smart utilities', () => {
    const calls: string[] = []
    const css = MasterCSS.create({
      manifest: defaultManifest,
      nativeDeclarationMatcher: ({ property, value }) => {
        calls.push(property + ':' + value)
        return true
      }
    })

    expect(css.createRule('float:left')?.text).toBe('.float\\:left{float:left}')
    expect(css.createRule('opacity:.7')?.text).toBe('.opacity\\:\\.7{opacity:0.7}')
    expect(css.createRule('display:block')?.text).toBe('.display\\:block{display:block}')
    expect(css.generate('view-transition-name:hero')[0]?.text).toBe('.view-transition-name\\:hero{view-transition-name:hero}')
    expect(css.createRule('z:10')?.text).toBe('.z\\:10{z-index:10}')
    expect(css.createRule('margin:4x')?.text).toBe('.margin\\:4x{margin:1rem}')
    expect(css.createRule('m:4x')?.text).toBe('.m\\:4x{margin:1rem}')
    expect(css.createRule('mt:4x')?.text).toBe('.mt\\:4x{margin-top:1rem}')
    expect(css.createRule('scroll-mys:1x')?.text).toBe('.scroll-mys\\:1x{scroll-margin-block-start:0.25rem}')
    expect(css.createRule('font:1rem')?.text).toBe('.font\\:1rem{font-size:1rem}')
    expect(css.createRule('fg:red-60')?.text).toBe('.fg\\:red-60{color:var(--color-red-60)}')
    expect(css.createRule('bg:red-60')?.text).toBe('.bg\\:red-60{background-color:var(--color-red-60)}')

    expect(calls).toEqual([
      'float:left',
      'opacity:0.7',
      'display:block',
      'view-transition-name:hero',
      'z-index:10',
      'margin:1rem',
      'margin-top:1rem',
      'scroll-margin-block-start:0.25rem',
      'color:var(--color-red-60)'
    ])
  })

  test('classifies native shorthand declarations for priority sorting', () => {
    const css = MasterCSS.create({
      manifest: defaultManifest,
      nativeDeclarationMatcher: ({ property }) =>
        property === 'margin' || property === 'margin-left' || property === 'margin-inline'
    })

    expect(css.createRule('margin:1rem')?.type).toBe(UtilityType.Shorthand)
    expect(css.createRule('margin-left:2rem')?.type).toBe(UtilityType.Normal)

    css.ensureClassRules('mx:2rem', 'margin:1rem')
    expect(css.utilitiesLayer.rules.map(({ name }) => name))
      .toEqual(['margin:1rem', 'mx:2rem'])
  })
})

describe.concurrent('manifest-driven layer and lifecycle parity', () => {
  test('starts empty and inserts on demand', () => {
    const css = createDefaultCSS()

    expect(css.text).toBe('')
    css.ensureClassRules('text-center')
    expect(css.text).toContain('@layer utilities{.text-center{text-align:center}}')
  })

  test('prevents duplicate insertion', () => {
    const css = createDefaultCSS()

    css.ensureClassRules('text-center', 'text-center')
    expect(css.utilitiesLayer.rules).toHaveLength(1)
  })

  test('does not duplicate emittedGlobals variables', () => {
    const css = MasterCSS.create({
      manifest: defaultManifest,
      emittedGlobals: {
        variables: {
          'color-red-60': 1
        }
      }
    })

    css.ensureClassRules('bg:red-60')
    expect(css.text).toBe('@layer utilities{.bg\\:red-60{background-color:var(--color-red-60)}}')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
      'color-red-60': 2
    })

    css.deleteClassRules('bg:red-60')
    expect(css.text).toBe('')
    expect(Object.fromEntries(css.themeLayer.tokenCounts)).toMatchObject({
      'color-red-60': 1
    })
  })

  test('does not duplicate emittedGlobals animations', () => {
    const css = MasterCSS.create({
      manifest: defaultManifest,
      emittedGlobals: {
        animations: {
          fade: 1
        }
      }
    })

    css.ensureClassRules('animate:fade')
    expect(css.text).toBe('@layer theme{:root{--animate-fade:fade 1s infinite}}@layer utilities{.animate\\:fade{animation:var(--animate-fade)}}')
    expect(Object.fromEntries(css.animationsNonLayer.tokenCounts)).toEqual({
      fade: 2
    })

    css.deleteClassRules('animate:fade')
    expect(css.text).toBe('')
    expect(Object.fromEntries(css.animationsNonLayer.tokenCounts)).toEqual({
      fade: 1
    })
  })

  test('executes semantic component utilities from manifest records', () => {
    const css = createCSSWithSemanticUtilities([
      {
        name: 'btn',
        rules: [
          { declarations: { display: 'inline-flex' } },
          { declarations: { height: '2.5rem' } }
        ]
      }
    ])

    expectLayerText(css, 'btn', 'componentsLayer', '.btn{display:inline-flex}.btn{height:2.5rem}')
  })

  test('keeps semantic utility declarations in their configured layer', () => {
    const css = MasterCSS.create({
      manifest: createManifestWithSemanticUtilities([
      {
        name: 'prose',
        layer: 'defaults',
        rules: [{
          selector: '& :is(p)',
          declarations: { 'font-size': '1rem' }
        }]
      }
    ])
    })

    css.ensureClassRules('prose')
    expect(css.defaultsLayer.text).toContain('@layer defaults{.prose :is(p){font-size:1rem}}')
    expect(css.componentsLayer.text).toBe('')
    expect(css.text).not.toContain('@layer components{@layer defaults')
  })

  test('keeps explicit layer variants routed to the requested layer', () => {
    expectLayerText(createDefaultCSS(), 'block@base', 'baseLayer', '.block\\@base{display:block}')
    expectLayerText(createDefaultCSS(), 'block@default', 'defaultsLayer', '.block\\@default{display:block}')
    expectLayerText(createDefaultCSS(), 'block@component', 'componentsLayer', '.block\\@component{display:block}')
    expectLayerText(createDefaultCSS(), 'block@utility', 'utilitiesLayer', '.block\\@utility{display:block}')
    expectLayerText(createDefaultCSS(), 'font:.75rem_:is(code,pre)@base', 'baseLayer', '.font\\:\\.75rem_\\:is\\(code\\,pre\\)\\@base :is(code,pre){font-size:0.75rem}')
  })

  test('keeps deterministic rule ordering independent of insertion order', () => {
    const css = createDefaultCSS()
    css.ensureClassRules(
      'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
      'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
      'font:.75rem', 'font:medium', 'text-center', 'fixed', 'block', 'round', 'b:0'
    )

    expect(css.utilitiesLayer.rules.map(({ name }) => name)).toEqual([
      'block',
      'fixed',
      'round',
      'text-center',
      'b:0',
      'm:0',
      'mx:0',
      'my:0',
      'p:0',
      'px:0',
      'py:0',
      'font:.75rem',
      'font:medium',
      'mb:0',
      'ml:0',
      'mr:0',
      'mt:0',
      'pb:0',
      'pl:0',
      'pr:0',
      'pt:0'
    ])
  })

  test('recovers generated utilities from selector text', () => {
    const css = createDefaultCSS()

    expect(css.createRulesFromSelectorText('.font\\:heavy')?.[0]).toMatchObject({ name: 'font:heavy' })
    expect(css.createRulesFromSelectorText('.hidden\\_button\\[disabled\\] button[disabled]')?.[0])
      .toMatchObject({ name: 'hidden_button[disabled]' })
    expect(css.createRulesFromSelectorText('.ml\\:-50px\\_\\:where\\(\\.code\\,\\.codeTabs\\,\\.demo\\)\\@\\<md')?.[0])
      .toMatchObject({ name: 'ml:-50px_:where(.code,.codeTabs,.demo)@<md' })
    expect(css.createRulesFromSelectorText('.active .hidden\\:within\\(\\.active\\)')?.[0])
      .toMatchObject({ name: 'hidden:within(.active)' })
    expect(css.createRulesFromSelectorText('.dark .active .hidden\\:within\\(\\.active\\)\\@dark')?.[0])
      .toMatchObject({ name: 'hidden:within(.active)@dark' })

    const scopedManifest = cloneManifest()
    scopedManifest.settings = {
      ...(scopedManifest.settings || {}),
      scope: '#app',
      modeTrigger: 'class',
      modes: ['dark']
    }
    const scopedCSS = MasterCSS.create({ manifest: scopedManifest })
    const rule = scopedCSS.createRule('block:hover@dark')
    expect(rule?.selectorText).toBe('.dark #app .block\\:hover\\@dark:hover')
    expect(scopedCSS.createRulesFromSelectorText(rule!.selectorText)?.[0]).toMatchObject({
      name: 'block:hover@dark'
    })
  })
})
