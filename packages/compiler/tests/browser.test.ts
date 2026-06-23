import { expect, test } from 'vitest'
import { MasterCSS } from '@master/css-engine'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { compileCSSManifest } from '../src/browser'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

function createTestCSS(manifest: MasterCSSManifest) {
    return MasterCSS.create({ manifest })
}

test.concurrent('browser compileCSSManifest lowers directives with a base manifest', async () => {
    const result = await compileCSSManifest(`
        @components {
            btn {
                @compose flex;
                color: red;
            }
        }
    `, {
        baseManifest: defaultManifest
    })
    const css = createTestCSS(result.manifest)

    css.add('btn')

    expect(result.warnings).toEqual([])
    expect(result.manifest.utilities?.some((utility) => utility.name === 'btn' && utility.layer === 'components')).toBe(true)
    expect(css.text).toContain('.btn')
    expect(css.text).toContain('display:flex')
    expect(css.text).toContain('color:red')
})

test.concurrent('browser compileCSSManifest rejects @reference directives', async () => {
    await expect(compileCSSManifest('@reference "./tokens.css";')).rejects.toThrow(
        'Browser compileCSSManifest cannot resolve @reference directives'
    )
})
