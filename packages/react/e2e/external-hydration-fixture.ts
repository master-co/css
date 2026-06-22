import type { MasterCSSHydrationManifest, MasterCSSManifest } from '@master/css-runtime'
import UtilityType from 'shared/utility-type'

export const externalHydrationManifestSource = '/_master-css/hydration/react-provider.json'
export const externalManifest = {
    version: 1,
    utilities: [
        {
            id: '.btn',
            name: 'btn',
            type: UtilityType.Semantic,
            order: 0,
            layer: 'components',
            emit: {
                type: 'static',
                rules: [
                    { selector: '&', declarations: { border: '0.125rem solid oklch(63.7% 0.237 25.331)' } }
                ]
            },
            matchers: [{ type: 'static', name: 'btn' }]
        }
    ],
    utilityBuckets: {
        arbitrary: [0]
    }
} as unknown as MasterCSSManifest

export const externalHydrationManifest = {
    version: 1,
    rules: [
        {
            className: 'btn',
            key: 'btn',
            layer: 'components',
            type: UtilityType.Semantic,
            sortTier: 0,
            priority: {
                selector: 0
            },
            text: '.btn{border:0.125rem solid oklch(63.7% 0.237 25.331)}',
            selectorText: '.btn'
        }
    ]
} as unknown as MasterCSSHydrationManifest

export const externalCSS = '@layer components{.btn{border:0.125rem solid oklch(63.7% 0.237 25.331)}}'
