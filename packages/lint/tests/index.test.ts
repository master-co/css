import { describe, expect, test } from 'vitest'
import UtilityType from '@master/css-schema/utility-type'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import {
    defaultCanonicalClassNameOptions,
    defaultClassLintSettings,
    findClassConflicts,
    getClassValidationIssues,
    suggestCanonicalClassGroups,
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
                { className: 'm:10px', conflicts: ['m:20px'] }
            ])
    })

    test('ignores invalid classes', () => {
        expect(findClassConflicts(['a', 'hello:world', 'm:10px', 'm:20px'], css))
            .toEqual([
                { className: 'm:10px', conflicts: ['m:20px'] }
            ])
    })

    test('keeps the last conflicting class', () => {
        expect(findClassConflicts(['m:sm', 'm:md', 'm:lg'], css))
            .toEqual([
                { className: 'm:sm', conflicts: ['m:lg'] },
                { className: 'm:md', conflicts: ['m:lg'] }
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

    test('suggests static utility aliases from generated declarations', () => {
        expect(suggestCanonicalClassName('position:relative', css)).toBe('rel')
        expect(suggestCanonicalClassName('display:none', css)).toBe('hidden')
        expect(suggestCanonicalClassName('visibility:hidden', css)).toBe('invisible')
        expect(suggestCanonicalClassName('height:100vh', css)).toBe('vh')
        expect(suggestCanonicalClassName('width:100vw', css)).toBe('vw')
        expect(suggestCanonicalClassName('aspect-ratio:1/1', css)).toBe('square')
    })

    test('suggests multi-value theme tokens', () => {
        expect(suggestCanonicalClassName('m:1rem|1.5rem', css)).toBe('m:md|lg')
        expect(suggestCanonicalClassName('p:.5rem|1rem', css)).toBe('p:xs|md')
        expect(suggestCanonicalClassName('r:.25rem|.375rem', css)).toBe('r:sm|md')
    })

    test('suggests theme tokens from CSS variable references', () => {
        expect(suggestCanonicalClassName('m:var(--spacing-md)', css)).toBe('m:md')
        expect(suggestCanonicalClassName('r:var(--radius-md)', css)).toBe('r:md')
        expect(suggestCanonicalClassName('fg:var(--color-red-60)', css)).toBe('fg:red-60')
    })

    test('does not suggest partial multi-value or unknown variable tokens', () => {
        expect(suggestCanonicalClassName('m:1rem|1.125rem', css)).toBeUndefined()
        expect(suggestCanonicalClassName('m:var(--spacing-unknown)', css)).toBeUndefined()
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
        expect(suggestCanonicalClassName('m:var(--spacing-md)', css, {
            ...defaultCanonicalClassNameOptions,
            preferVariableReferences: false
        })).toBeUndefined()
        expect(suggestCanonicalClassName('m:1rem|1.5rem', css, {
            ...defaultCanonicalClassNameOptions,
            preferMultiValueTokens: false
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

describe('canonical class group suggestions', () => {
    test('suggests size composition utilities', () => {
        expect(suggestCanonicalClassGroups(['w:md', 'h:md'], css)).toEqual([
            { classNames: ['w:md', 'h:md'], recommended: 'size:md' }
        ])
        expect(suggestCanonicalClassGroups(['width:md', 'height:md'], css)).toEqual([
            { classNames: ['width:md', 'height:md'], recommended: 'size:md' }
        ])
        expect(suggestCanonicalClassGroups(['w:1rem', 'h:1rem'], css)).toEqual([
            { classNames: ['w:1rem', 'h:1rem'], recommended: 'size:1rem' }
        ])
        expect(suggestCanonicalClassGroups(['w:md:hover', 'h:md:hover'], css)).toEqual([
            { classNames: ['w:md:hover', 'h:md:hover'], recommended: 'size:md:hover' }
        ])
    })

    test('suggests min and max size composition utilities', () => {
        expect(suggestCanonicalClassGroups(['min-w:md', 'min-h:md'], css)).toEqual([
            { classNames: ['min-w:md', 'min-h:md'], recommended: 'min-size:md' }
        ])
        expect(suggestCanonicalClassGroups(['max-w:md', 'max-h:md'], css)).toEqual([
            { classNames: ['max-w:md', 'max-h:md'], recommended: 'max-size:md' }
        ])
    })

    test('does not suggest unsafe composition groups', () => {
        expect(suggestCanonicalClassGroups(['w:md', 'h:lg'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['w:md', 'h:md@sm'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['w:error', 'h:md'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['w:md', 'h:md'], css, {
            ...defaultCanonicalClassNameOptions,
            preferCompositionUtilities: false
        })).toEqual([])
    })
})

test('exports default lint target settings', () => {
    expect(defaultClassLintSettings.classAttributes).toEqual(['class', 'className'])
    expect(defaultClassLintSettings.classFunctions).toContain('clsx')
    expect(defaultClassLintSettings.ignoredKeys).toContain('compoundVariants')
})
