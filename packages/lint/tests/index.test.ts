import { describe, expect, test } from 'vitest'
import UtilityType from '@master/css-schema/utility-type'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import {
    defaultCanonicalClassNameOptions,
    defaultClassLintSettings,
    findClassConflicts,
    getClassValidationIssues,
    sortClassNames,
    suggestCanonicalClassName
} from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

const css = createCSSWithNativeDeclarations(createPresetManifest())

describe('class sorting', () => {
    test('sorts known classes and keeps unknown classes last', () => {
        expect(sortClassNames(['font:1.5rem', 'fg:white', 'm:2x', 'p:2x', 'bg:black'], css))
            .toEqual(['m:2x', 'p:2x', 'bg:black', 'fg:white', 'font:1.5rem'])
        expect(sortClassNames(['mt:0', 'hello:world', 'a', 'font:error'], css))
            .toEqual(['mt:0', 'a', 'font:error', 'hello:world'])
    })

    test('deduplicates repeated classes', () => {
        expect(sortClassNames(['w:3x', 'w:0.375rem@lg', 'w:3x'], css))
            .toEqual(['w:3x', 'w:0.375rem@lg'])
    })
})

describe('class conflicts', () => {
    test('finds classes with matching declarations and variants', () => {
        expect(findClassConflicts(['m:10px', 'm:20px', 'm:30px:hover', 'm:40px@dark'], css))
            .toEqual([
                { className: 'm:10px', conflicts: ['m:20px'] },
                { className: 'm:20px', conflicts: ['m:10px'] }
            ])
    })

    test('ignores invalid classes', () => {
        expect(findClassConflicts(['a', 'hello:world', 'm:10px', 'm:20px'], css))
            .toEqual([
                { className: 'm:10px', conflicts: ['m:20px'] },
                { className: 'm:20px', conflicts: ['m:10px'] }
            ])
    })
})

describe('class validation issues', () => {
    test('reports invalid generated CSS', () => {
        expect(getClassValidationIssues('text-decoration:bad()', css)).toMatchObject([
            { kind: 'invalid', className: 'text-decoration:bad()' }
        ])
    })

    test('reports unknown classes only when requested', () => {
        expect(getClassValidationIssues('unknown-class', css)).toEqual([])
        expect(getClassValidationIssues('unknown-class', css, { disallowUnknownClass: true })).toEqual([
            {
                kind: 'unknown',
                className: 'unknown-class',
                message: '"unknown-class" is not a valid or known class.'
            }
        ])
        expect(getClassValidationIssues('unknown-class', css, { disallowUnknownClass: true, displayClassName: 'raw-class' })[0]?.message)
            .toBe('"raw-class" is not a valid or known class.')
    })
})

describe('canonical class suggestions', () => {
    test('suggests static utilities, theme tokens, and property aliases', () => {
        expect(suggestCanonicalClassName('text-align:center:hover@sm', css)).toBe('text-center:hover@sm')
        expect(suggestCanonicalClassName('font:16px', css)).toBe('font:md')
        expect(suggestCanonicalClassName('margin:md', css)).toBe('m:md')
    })

    test('respects canonical suggestion options', () => {
        expect(suggestCanonicalClassName('display:block', css, {
            ...defaultCanonicalClassNameOptions,
            preferStaticUtilities: false
        })).toBeUndefined()
        expect(suggestCanonicalClassName('font:16px', css, {
            ...defaultCanonicalClassNameOptions,
            preferThemeTokens: false
        })).toBeUndefined()
        expect(suggestCanonicalClassName('margin:md', css, {
            ...defaultCanonicalClassNameOptions,
            preferPropertyAliases: false
        })).toBeUndefined()
    })

    test('does not suggest component-layer semantic utilities', () => {
        const componentCSS = createCSSWithNativeDeclarations(createPresetManifest({
            utilities: [
                {
                    name: 'btn',
                    type: UtilityType.Semantic,
                    layer: 'components',
                    declarations: { display: 'block' }
                }
            ]
        }))
        expect(suggestCanonicalClassName('btn', componentCSS)).toBeUndefined()
    })
})

test('exports default lint target settings', () => {
    expect(defaultClassLintSettings.classAttributes).toEqual(['class', 'className'])
    expect(defaultClassLintSettings.classFunctions).toContain('clsx')
    expect(defaultClassLintSettings.ignoredKeys).toContain('compoundVariants')
})
