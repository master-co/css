import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('font-feature-settings', () => {
    expect(createCSSWithTheme().create('font-feature:\'cv02\',\'cv03\',\'cv04\',\'cv11\'')?.text).toBe('.font-feature\\:\\\'cv02\\\'\\,\\\'cv03\\\'\\,\\\'cv04\\\'\\,\\\'cv11\\\'{font-feature-settings:\'cv02\',\'cv03\',\'cv04\',\'cv11\'}')
})

test.concurrent('font-feature-settings uses font-feature namespace variables', () => {
    const css = createCSSWithTheme({
        variables: [{ namespace: 'font-feature', key: 'tabular', value: '\'tnum\'' }]
    })

    expect(css.create('font-feature:tabular')?.text).toBe('.font-feature\\:tabular{font-feature-settings:var(--font-feature-tabular)}')
    expect(css.create('font-feature:font-feature-tabular')?.text).toBe('.font-feature\\:font-feature-tabular{font-feature-settings:var(--font-feature-tabular)}')
})
