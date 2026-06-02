import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('zoom', () => {
    expect(createCSSWithTheme().create('zoom:1.25')?.text).toBe('.zoom\\:1\\.25{zoom:1.25}')
    expect(createCSSWithTheme().create('zoom:125%')?.text).toBe('.zoom\\:125\\%{zoom:125%}')
    expect(createCSSWithTheme({ variables: [{ namespace: 'zoom', key: 'compact', value: 1.1 }] }).create('zoom:compact')?.text).toBe('.zoom\\:compact{zoom:var(--zoom-compact)}')
})
