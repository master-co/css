import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'

test.concurrent('aspect-ratio', () => {
    expect(createCSSWithTheme().create('aspect:4/3')?.text).toBe('.aspect\\:4\\/3{aspect-ratio:4/3}')
})

test.concurrent('aspect-ratio uses aspect namespace variables', () => {
    const css = createCSSWithTheme({
        variables: [{ namespace: 'aspect', key: 'video', value: '16/9' }]
    })

    expect(css.create('aspect:video')?.text).toBe('.aspect\\:video{aspect-ratio:var(--aspect-video)}')
    expect(css.create('aspect:aspect-video')?.text).toBe('.aspect\\:aspect-video{aspect-ratio:var(--aspect-video)}')
    expect(css.create('aspect-ratio:video')?.text).toBe('.aspect-ratio\\:video{aspect-ratio:var(--aspect-video)}')
})
