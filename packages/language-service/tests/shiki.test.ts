import { expect, test } from 'vitest'

import {
    createMasterCSSShikiSemanticTokenDecorations,
    transformerMasterCSSSemanticTokens,
    type MasterCSSShikiCodeToHastOptions
} from '../src/shiki'
import type { Settings } from '../src/settings'

const config: Settings['config'] = {
    variables: [{ key: 'brand', value: '#123456' }],
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', declarations: { display: 'block' } }
            ]
        }
    ]
}

test.concurrent('creates Shiki decorations from Master CSS semantic tokens', () => {
    const code = '<div className="fg:brand:hover@sm block btn btn:hover@sm btn_div::before"></div>'
    const decorations = createMasterCSSShikiSemanticTokenDecorations(code, {
        lang: 'tsx',
        config
    })
    const tokens = decorations.map((decoration) => ({
        text: code.slice(decoration.start, decoration.end),
        type: decoration.type,
        modifiers: decoration.modifiers,
        classNames: decoration.properties?.class
    }))

    expect(tokens).toEqual(expect.arrayContaining([
        {
            text: 'fg',
            type: 'property',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-property']
        },
        {
            text: 'brand',
            type: 'variable',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-variable']
        },
        {
            text: 'block',
            type: 'class',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-class']
        },
        {
            text: 'btn',
            type: 'class',
            modifiers: ['declaration'],
            classNames: ['mcss-semantic', 'mcss-semantic-class', 'mcss-semantic-class-declaration']
        },
        {
            text: 'div',
            type: 'type',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-type']
        },
        {
            text: 'before',
            type: 'modifier',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-modifier']
        },
        {
            text: '@sm',
            type: 'keyword',
            modifiers: [],
            classNames: ['mcss-semantic', 'mcss-semantic-keyword']
        }
    ]))
    expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'class' && modifiers.includes('declaration'))).toHaveLength(3)
})

test.concurrent('appends semantic decorations from the Shiki tokens hook', () => {
    const code = '<div className="btn:hover@sm"></div>'
    const options: MasterCSSShikiCodeToHastOptions = {
        lang: 'tsx',
        decorations: [
            { start: 0, end: 0, properties: { class: 'existing-decoration' } }
        ]
    }
    const transformer = transformerMasterCSSSemanticTokens({
        config,
        classPrefix: 'master-css-token',
        dataAttributes: false
    })

    transformer.tokens.call({ source: code, options }, [])

    expect(options.decorations?.[0]?.properties?.class).toBe('existing-decoration')
    expect(options.decorations).toEqual(expect.arrayContaining([
        expect.objectContaining({
            start: code.indexOf('btn'),
            end: code.indexOf('btn') + 'btn'.length,
            type: 'class',
            modifiers: ['declaration'],
            properties: {
                class: ['master-css-token', 'master-css-token-class', 'master-css-token-class-declaration']
            }
        }),
        expect.objectContaining({
            start: code.indexOf('hover'),
            end: code.indexOf('hover') + 'hover'.length,
            type: 'modifier',
            modifiers: [],
            properties: {
                class: ['master-css-token', 'master-css-token-modifier']
            }
        })
    ]))
})
