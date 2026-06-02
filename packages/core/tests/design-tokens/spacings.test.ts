import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
const config = { variables: [{ namespace: 'spacing', key: 'x1', value: 16 }] }

test.concurrent('spacing', () => {
    expect(createCSSWithTheme(config).create('m:x1')?.text).toContain('margin:calc(var(--spacing-x1) / 16 * 1rem)')
    expect(createCSSWithTheme(config).create('mt:x1')?.text).toContain('margin-top:calc(var(--spacing-x1) / 16 * 1rem)')
    expect(createCSSWithTheme(config).create('scroll-mt:x1')?.text).toContain('scroll-margin-top:calc(var(--spacing-x1) / 16 * 1rem)')
    expect(createCSSWithTheme(config).create('p:x1')?.text).toContain('padding:calc(var(--spacing-x1) / 16 * 1rem)')
    expect(createCSSWithTheme(config).create('pt:x1')?.text).toContain('padding-top:calc(var(--spacing-x1) / 16 * 1rem)')
    expect(createCSSWithTheme(config).create('cx:x1')?.text).toContain('cx:var(--spacing-x1)')
    expect(createCSSWithTheme(config).create('y:x1')?.text).toContain('y:var(--spacing-x1)')
    expect(createCSSWithTheme(config).create('outline-offset:x1')?.text).toContain('outline-offset:calc(var(--spacing-x1) / 16 * 1rem)')
})
