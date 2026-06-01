import { expect, test } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('zoom', () => {
    expect(createCSS().create('zoom:1.25')?.text).toBe('.zoom\\:1\\.25{zoom:1.25}')
    expect(createCSS().create('zoom:125%')?.text).toBe('.zoom\\:125\\%{zoom:125%}')
    expect(createCSS({ variables: [{ namespace: 'zoom', key: 'compact', value: 1.1 }] }).create('zoom:compact')?.text).toBe('.zoom\\:compact{zoom:var(--zoom-compact)}')
})
