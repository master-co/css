import { describe, expect, it } from 'vitest'
import {
  flattenMasterCSSManifestVariables,
  groupMasterCSSManifestVariables,
  type MasterCSSManifest
} from '../src/manifest'
import { stringifyMasterCSSManifestJSON } from '../src/manifest-json'

describe('@master/css-schema manifest helpers', () => {
  it('groups and flattens manifest variables', () => {
    const variables = groupMasterCSSManifestVariables([
      { namespace: 'color', key: 'brand', value: '#123' },
      { key: 'full', value: '100%', inline: true }
    ])

    expect(variables).toEqual({
      color: [{ key: 'brand', value: '#123' }],
      '': [{ key: 'full', value: '100%', inline: true }]
    })
    expect(flattenMasterCSSManifestVariables(variables)).toEqual([
      { namespace: 'color', name: 'color-brand', key: 'brand', type: 'string', value: '#123' },
      { name: 'full', key: 'full', type: 'string', value: '100%', inline: true }
    ])
  })

  it('normalizes derived manifest fields in JSON', () => {
    const manifest: MasterCSSManifest = {
      version: 1,
      variables: {
        color: [{ name: 'color-brand', key: 'brand', type: 'string', value: '#123' }]
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

    expect(stringifyMasterCSSManifestJSON(manifest)).toBe(
      '{"version":1,"variables":{"color":[{"key":"brand","value":"#123"}]},"utilities":[{"id":"block","type":-2,"emit":{"type":"static","rules":[{"declarations":{"display":"block"}}]},"matchers":[{"type":"static","name":"block"}]}]}'
    )
  })
})
