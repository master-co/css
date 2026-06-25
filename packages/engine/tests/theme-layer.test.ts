import { describe, expect, test } from 'vitest'
import { MasterCSS } from '../src'
import { cloneManifest } from './helpers/css-tester'
import { flattenMasterCSSManifestVariables, groupMasterCSSManifestVariables } from '@master/css-schema/manifest'

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
        manifest.variables = groupMasterCSSManifestVariables([
            ...flattenMasterCSSManifestVariables(manifest.variables)
                .filter((variable) => !variable.name || !overriddenVariables.has(variable.name)),
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
        ])

        const css = MasterCSS.create({ manifest: manifest })
        css.add('fg:blue')
        css.add('fg:accent')

        const text = css.themeLayer.text
        expect(text).toContain('.light,:root{color-scheme:light;--color-blue:#66f}')
        expect(text).toContain(':root{--color-accent:var(--color-blue);--color-amber-10:#fed}')
        expect(text).toContain('.dark{color-scheme:dark;--color-blue:#44f;--color-accent:var(--color-amber-10)}')
        expect(text.indexOf(':root{--color-accent')).toBeLessThan(text.indexOf('.dark{color-scheme:dark;--color-blue:#44f;--color-accent'))
    })

    test('emits color-scheme for built-in class mode buckets', () => {
        const manifest = createModeVariableManifest('class')
        const css = MasterCSS.create({ manifest })

        css.add('fg:primary')

        expect(css.themeLayer.text).toBe('@layer theme{.light,:root{color-scheme:light;--color-primary:#000}.dark{color-scheme:dark;--color-primary:#fff}}')
    })

    test('emits color-scheme for built-in host mode buckets', () => {
        const manifest = createModeVariableManifest('host')
        const css = MasterCSS.create({ manifest })

        css.add('fg:primary')

        expect(css.themeLayer.text).toBe('@layer theme{:host(.light),:host{color-scheme:light;--color-primary:#000}:host(.dark){color-scheme:dark;--color-primary:#fff}}')
    })

    test('does not merge the default mode selector when default-mode is none', () => {
        const manifest = createModeVariableManifest('class', 'none')
        const css = MasterCSS.create({ manifest })

        css.add('fg:primary')

        expect(css.themeLayer.text).toBe('@layer theme{.light{color-scheme:light;--color-primary:#000}.dark{color-scheme:dark;--color-primary:#fff}}')
    })

    test('does not emit color-scheme for media mode buckets', () => {
        const manifest = createModeVariableManifest('media')
        const css = MasterCSS.create({ manifest })

        css.add('fg:primary')

        expect(css.themeLayer.text).toBe('@layer theme{@media (prefers-color-scheme:light){:root{--color-primary:#000}}@media (prefers-color-scheme:dark){:root{--color-primary:#fff}}}')
    })

    test('does not emit color-scheme for custom mode buckets', () => {
        const manifest = createModeVariableManifest('class')
        manifest.settings!.modes = ['light', 'dark', 'sepia']
        manifest.variables = groupMasterCSSManifestVariables([{
            name: 'color-primary',
            key: 'primary',
            namespace: 'color',
            type: 'string',
            modes: {
                sepia: { type: 'string', value: '#753' }
            }
        }])
        const css = MasterCSS.create({ manifest })

        css.add('fg:primary')

        expect(css.themeLayer.text).toBe('@layer theme{.sepia{--color-primary:#753}}')
    })
})

function createModeVariableManifest(modeTrigger: 'class' | 'host' | 'media', defaultMode = 'light') {
    const manifest = cloneManifest()
    manifest.settings = {
        ...manifest.settings,
        defaultMode,
        modeTrigger,
        modes: ['light', 'dark']
    }
    manifest.variables = groupMasterCSSManifestVariables([{
        name: 'color-primary',
        key: 'primary',
        namespace: 'color',
        type: 'string',
        modes: {
            light: { type: 'string', value: '#000' },
            dark: { type: 'string', value: '#fff' }
        }
    }])
    return manifest
}
