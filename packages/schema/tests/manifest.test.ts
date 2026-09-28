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
      { namespace: 'color', name: 'color-brand', key: 'brand', type: 'string', values: [{ path: [':root,:host'], value: '#123' }] },
      { name: 'full', key: 'full', type: 'string', values: [{ path: [':root,:host'], value: '100%' }] }
    ])
  })

  it('normalizes derived manifest fields in JSON', () => {
    const manifest: MasterCSSManifest = { theme: [{ type: 'rule', prelude: ':root,:host', children: [{ type: 'declaration', name: 'color-brand', value: '#123' }] }],
      version: 2, languageVersion: 4,
      variables: {
        color: [{ name: 'color-brand', key: 'brand', type: 'string', values: [{ path: [':root,:host'], value: '#123' }] }]
      },
      utilities: [{
        id: 'block',
        name: 'block',
        type: -2,
        order: 0,
        layer: 'utilities',
        emit: {
          type: 'static',
          rules: [{ declarations: { display: 'block' } }]
        },
        matchers: [{ type: 'static', name: 'block' }]
      }]
    }

    expect(serializeMasterCSSManifest(manifest)).toBe(
      '{"theme":[{"type":"rule","prelude":":root,:host","children":[{"type":"declaration","name":"color-brand","value":"#123"}]}],"version":2,"languageVersion":4,"variables":{"color":[{"key":"brand","values":[{"path":[":root,:host"],"value":"#123"}]}]},"utilities":[{"id":"block","type":-2,"emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},"matchers":[{"type":"static","name":"block"}]}]}'
    )
  })
})
