import { describe, expect, test } from 'vitest'
import { createCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'

describe.concurrent('ThemeLayer', () => {
    test('keeps default variable buckets before mode buckets when defaults are inserted later', () => {
        const manifest = cloneManifest()
        manifest.settings = {
            ...manifest.settings,
            defaultMode: 'light',
            modeTrigger: 'class',
            modes: ['light', 'dark']
        }
        const overriddenVariables = new Set(['color-blue', 'color-accent', 'color-amber-10'])
        manifest.variables = [
            ...(manifest.variables || []).filter((variable) => !variable.name || !overriddenVariables.has(variable.name)),
            {
                name: 'color-blue',
                key: 'blue',
                namespace: 'color',
                type: 'string',
                modes: {
                    light: { type: 'string', value: '#66f' },
                    dark: { type: 'string', value: '#44f' }
                }
            },
            {
                name: 'color-accent',
                key: 'accent',
                namespace: 'color',
                type: 'string',
                value: '$color-blue',
                dependencies: ['color-blue', 'color-amber-10'],
                modes: {
                    dark: { type: 'string', value: '$color-amber-10' }
                }
            },
            {
                name: 'color-amber-10',
                key: 'amber-10',
                namespace: 'color',
                type: 'string',
                value: '#fed'
            }
        ]

        const css = createCSS(manifest)
        css.add('fg:blue')
        css.add('fg:accent')

        const text = css.themeLayer.text
        expect(text).toContain('.light,:root{--color-blue:#66f}')
        expect(text).toContain(':root{--color-accent:var(--color-blue);--color-amber-10:#fed}')
        expect(text).toContain('.dark{--color-blue:#44f;--color-accent:var(--color-amber-10)}')
        expect(text.indexOf(':root{--color-accent')).toBeLessThan(text.indexOf('.dark{--color-blue:#44f;--color-accent'))
    })
})
