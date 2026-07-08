import { describe, expect, it } from 'vitest'
import { createMasterCSSManifest } from '../src/master-css-manifest'
import UtilityType from '@master/css-schema/utility-type'
import { flattenMasterCSSManifestVariables, type MasterCSSManifest } from '@master/css-schema/manifest'
import { MasterCSS } from '@master/css-engine'

function variablesOf(manifest: MasterCSSManifest) {
  return flattenMasterCSSManifestVariables(manifest.variables)
}

describe.concurrent('createMasterCSSManifest', () => {
  it('lowers variables into resolved records with modes and dependencies without synthetic negative aliases', () => {
    const manifest = createMasterCSSManifest({
      variables: [
        { namespace: 'spacing', key: 'card', value: 12, static: true },
        { namespace: 'color', key: 'brand', value: '$color-blue-50' },
        { namespace: 'color', key: 'brand', value: '#123', mode: 'dark', static: true }
      ]
    })

    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'spacing-card',
      key: 'card',
      namespace: 'spacing',
      type: 'number',
      value: 12,
      static: true
    }))
    expect(variablesOf(manifest).some((variable) => variable.name === '-spacing-card')).toBe(false)
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'color-brand',
      key: 'brand',
      namespace: 'color',
      type: 'string',
      value: '$color-blue-50',
      modes: {
        dark: {
          type: 'string',
          value: '#123'
        }
      },
      dependencies: expect.arrayContaining(['color-blue-50']),
      static: true
    }))
  })

  it('preserves explicitly authored negative variables', () => {
    const manifest = createMasterCSSManifest({
      variables: [
        { namespace: 'spacing', key: '-card', value: -12, static: true }
      ]
    })

    expect(variablesOf(manifest)).toEqual([
      expect.objectContaining({
        name: 'spacing--card',
        key: '-card',
        namespace: 'spacing',
        type: 'number',
        value: -12,
        static: true
      })
    ])
  })

  it('lowers static animation options', () => {
    const manifest = createMasterCSSManifest({
      animations: {
        fade: {
          to: {
            opacity: '1'
          }
        }
      },
      animationOptions: {
        fade: {
          static: true
        }
      }
    })

    expect(manifest.animationOptions?.fade).toEqual({ static: true })
  })

  it('does not serialize manifest registry input', () => {
    const manifest = createMasterCSSManifest({
      keyAliases: { w: 'inline-size' },
      nativeValueNamespaces: [{
        properties: ['width'],
        variableAliasRefs: ['~spacing']
      }]
    } as any, {
      baseManifest: {
        version: 1,
        keyAliases: { h: 'height' },
        nativeValueNamespaces: [{
          properties: ['height'],
          variableAliasRefs: ['~spacing']
        }]
      } as any
    })

    expect('keyAliases' in manifest).toBe(false)
    expect('nativeValueNamespaces' in manifest).toBe(false)
  })

  it('lowers breakpoint and container aliases into at-rule node maps', () => {
    const manifest = createMasterCSSManifest({
      variables: [
        { namespace: 'breakpoint', key: 'card', value: 777 },
        { namespace: 'container', key: 'panel', value: 333 }
      ]
    })

    expect(manifest.atRules?.card).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'number', unit: 'rem' })]
    })
    expect(manifest.breakpointAtRules?.card).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'number', unit: 'rem' })]
    })
    expect(manifest.containerAtRules?.panel).toMatchObject({
      id: 'container',
      nodes: [expect.objectContaining({ type: 'number', unit: 'rem' })]
    })
  })

  it('keeps unitful numeric theme tokens comparable', () => {
    const manifest = createMasterCSSManifest({
      variables: [
        { namespace: 'spacing', key: 'card', value: '1.5rem' },
        { namespace: 'radius', key: 'card', value: '8px' },
        { namespace: 'breakpoint', key: 'card', value: '48rem' },
        { namespace: 'container', key: 'panel', value: '512px' },
        { namespace: 'shadow', key: 'card', value: '1rem' }
      ]
    })

    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'spacing-card',
      type: 'number',
      value: '1.5rem',
      numeric: { value: 1.5, unit: 'rem' }
    }))
    expect(variablesOf(manifest)).toContainEqual(expect.objectContaining({
      name: 'radius-card',
      type: 'number',
      value: '8px',
      numeric: { value: 8, unit: 'px' }
    }))
    expect(variablesOf(manifest).find((variable) => variable.name === 'shadow-card')).toMatchObject({
      type: 'string',
      value: '1rem'
    })
    expect(manifest.breakpointAtRules?.card).toMatchObject({
      id: 'media',
      nodes: [expect.objectContaining({ type: 'number', value: 48, unit: 'rem' })]
    })
    expect(manifest.containerAtRules?.panel).toMatchObject({
      id: 'container',
      nodes: [expect.objectContaining({ type: 'number', value: 32, unit: 'rem' })]
    })
  })

  it('lowers variants into compiled selector and at-rule branches', () => {
    const manifest = createMasterCSSManifest({
      variants: [
        { token: ':hocus', branches: [{ selector: '&:hover,&:focus' }] },
        { token: '@motion-safe', branches: [{ atRules: ['@media (prefers-reduced-motion:no-preference)'] }] }
      ]
    })

    expect(manifest.selectors?.[':hocus']).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'pseudo-class', value: 'hover' })
    ]))
    expect(manifest.variants?.find((variant) => variant.token === ':hocus')?.branches[0].selectorNodes)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ type: 'pseudo-class', value: 'hover' })
      ]))
    expect(manifest.variants?.find((variant) => variant.token === '@motion-safe')?.branches[0].atRuleNodes)
      .toEqual([
        expect.objectContaining({
          id: 'media',
          nodes: expect.arrayContaining([
            expect.objectContaining({ type: 'string', name: 'prefers-reduced-motion' })
          ])
        })
      ])
  })

  it('lowers CSS-defined semantic utilities and matcher buckets', () => {
    const manifest = createMasterCSSManifest({
      utilities: [
        {
          name: 'card',
          layer: 'components',
          declarations: {
            display: 'grid',
            color: 'var(--color-primary)'
          }
        }
      ]
    })
    const index = manifest.utilities?.findIndex((utility) => utility.name === 'card') ?? -1
    const utility = manifest.utilities?.[index]

    expect(index).toBeGreaterThanOrEqual(0)
    expect(utility?.layer).toBe('components')
    expect(utility?.type).toBe(UtilityType.Semantic)
    expect(utility?.emit).toEqual({
      type: 'static',
      rules: [{
        declarations: {
          display: 'grid',
          color: 'var(--color-primary)'
        }
      }]
    })
    expect(utility?.matchers).toContainEqual({ type: 'static', name: 'card' })
    expect(MasterCSS.create({ manifest }).createRule('card')?.text).toBe('.card{display:grid;color:var(--color-primary)}')
  })
})
