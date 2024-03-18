import type { Config } from '@master/css'
import MasterCSSLanguageService from '../src/core'

test('explore', async () => {
    expect(new MasterCSSLanguageService({ cwd: __dirname }).css.customConfig.styles).toEqual({
        btn: 'inline-flex'
    } as Config)
})
