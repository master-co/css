import { describe, expect, it } from 'vitest'
import {
  flattenMasterCSSManifestVariables,
  groupMasterCSSManifestVariables,
  type MasterCSSManifest
} from '../src/manifest'
import { serializeMasterCSSManifest } from '../src/manifest'

describe('@master/css-schema manifest helpers', () => {
  it('groups and flattens manifest variables', () => {
    const variables = groupMasterCSSManifestVariables([
      { namespace: 'color', key: 'brand', values: [{ path: [':root,:host'], value: '#123' }] },
      { key: 'full', values: [{ path: [':root,:host'], value: '100%' }] }
    ])

    expect(variables).toEqual({
      color: [{ key: 'brand', values: [{ path: [':root,:host'], value: '#123' }] }],
      '': [{ key: 'full', values: [{ path: [':root,:host'], value: '100%' }] }]
    })
    expect(flattenMasterCSSManifestVariables(variables)).toEqual([
      { namespace: 'color', name: 'color-brand', key: 'brand', type: 'string' as const, values: [{ path: [':root,:host'], value: '#123' }] },
      { name: 'full', key: 'full', type: 'string' as const, values: [{ path: [':root,:host'], value: '100%' }] }
    ])
  })

  it('normalizes derived manifest fields in JSON', () => {
    const manifest: MasterCSSManifest = { theme: [{ type: 'rule' as const, prelude: ':root,:host', children: [{ type: 'declaration' as const, name: 'color-brand', value: '#123' }] }],
      version: 4 as const, languageVersion: 7 as const,
      variables: {
        color: [{ name: 'color-brand', key: 'brand', type: 'string' as const, values: [{ path: [':root,:host'], value: '#123' }] }]
      },
      mixins: [{
        name: '--card',
        body: [{ type: 'declaration' as const, property: 'display', value: [{ type: 'text' as const, value: 'block' }] }]
      }]
    }

    expect(JSON.parse(serializeMasterCSSManifest(manifest))).toEqual({
      ...manifest,
      variables: { color: [{ key: 'brand', values: [{ path: [':root,:host'], value: '#123' }] }] }
    })
  })
})
