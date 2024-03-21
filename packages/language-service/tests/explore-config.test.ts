import CSSLanguageService from '../src/core'

test('explore', async () => {
    expect(new CSSLanguageService({ cwd: __dirname }).css.customConfig.styles).toEqual({
        btn: 'inline-flex'
    })
})
