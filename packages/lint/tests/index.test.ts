import { describe, expect, test } from 'vitest'
import UtilityType from '@master/css-schema/utility-type'
import { createCSSWithNativeDeclarations } from '@master/css-validator'
import {
    defaultCanonicalClassNameOptions,
    defaultClassLintSettings,
    findClassConflicts,
    findPartialClassConflicts,
    findUnapprovedRawValueClasses,
    getClassValidationIssues,
    removeClassNamesFromClassList,
    replaceClassGroupInClassList,
    replaceClassNameInClassList,
    suggestCanonicalClassGroups,
    sortClassList,
    sortClassNames,
    suggestCanonicalClassName
} from '../src'
import { createPresetManifest } from './helpers/create-preset-manifest'

const css = createCSSWithNativeDeclarations(createPresetManifest())
const customManifest = createPresetManifest({
    settings: {
        rootSize: 16,
        modes: ['dark', 'midnight']
    },
    atRules: {
        tablet: {
            id: 'media',
            nodes: [{ type: 'number', value: 48, unit: 'rem' }]
        }
    },
    breakpointAtRules: {
        tablet: {
            id: 'media',
            nodes: [{ type: 'number', value: 48, unit: 'rem' }]
        }
    },
    variables: [
        { namespace: 'breakpoint', key: 'tablet', name: 'breakpoint-tablet', type: 'number', value: '48rem', numeric: { value: 48, unit: 'rem' } },
        { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
    ],
    variants: [
        { token: '@wide', branches: [{ atRules: ['@media (min-width: 80rem)'] }] }
    ],
    utilities: [
        {
            name: 'content-auto',
            type: UtilityType.Semantic,
            layer: 'utilities',
            declarations: { 'content-visibility': 'auto' }
        },
        {
            name: 'btn',
            type: UtilityType.Semantic,
            layer: 'components',
            declarations: { display: 'block' }
        }
    ]
})
const customCSS = createCSSWithNativeDeclarations(customManifest)

type PresetManifestInput = Parameters<typeof createPresetManifest>[0]
const registryFieldCSS = createCSSWithNativeDeclarations(createPresetManifest({
    variables: [
        { namespace: 'spacing', key: 'card', name: 'spacing-card', type: 'number', value: '1.25rem', numeric: { value: 1.25, unit: 'rem' } }
    ],
    keyAliases: { space: 'margin' },
    nativeValueNamespaces: [{
        properties: ['--space'],
        variableAliasRefs: ['~spacing']
    }]
} as PresetManifestInput & {
    keyAliases: Record<string, string>
    nativeValueNamespaces: { properties: string[], variableAliasRefs: string[] }[]
}))

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

describe('class list edits', () => {
    test('sorts class-list text while preserving useful whitespace and raw tokens', () => {
        expect(sortClassList('fg:white  m:2x\tfg:white', css))
            .toBe('m:2x  fg:white')
        expect(sortClassList('fg:white\nm:2x\nfg:white', css))
            .toBe('m:2x\nfg:white')
        expect(sortClassList('content:\\`\\` block', css, { unescape: '`' }))
            .toBe('block content:\\`\\`')
    })

    test('removes and replaces class-list tokens with adjacent whitespace', () => {
        expect(removeClassNamesFromClassList('a  b\tc', ['b']))
            .toBe('a\tc')
        expect(removeClassNamesFromClassList('a  a\tb', ['a']))
            .toBe('a\tb')
        expect(removeClassNamesFromClassList('a  a\tb', ['a', 'a']))
            .toBe('b')
        expect(removeClassNamesFromClassList('a\n  b\n  c', ['b']))
            .toBe('a\n  c')
        expect(replaceClassNameInClassList('content:\\\'\\\' block', 'content:\'\'', 'content:""', { unescape: '\'' }))
            .toBe('content:"" block')
        expect(replaceClassNameInClassList('content:\\`\\` block', 'content:``', 'content:none', { unescape: '`' }))
            .toBe('content:none block')
        expect(replaceClassNameInClassList('m:md block', 'm:md', 'mx:md mb:md'))
            .toBe('mx:md mb:md block')
        expect(replaceClassNameInClassList('a a b', 'a', 'c'))
            .toBe('c a b')
    })

    test('replaces grouped class-list tokens', () => {
        expect(replaceClassGroupInClassList('w:md h:md fg:red-60', ['w:md', 'h:md'], 'size:md'))
            .toBe('size:md fg:red-60')
        expect(replaceClassGroupInClassList('w:md\n  h:md\n  fg:red-60', ['w:md', 'h:md'], 'size:md'))
            .toBe('size:md\n  fg:red-60')
        expect(replaceClassGroupInClassList('w:md h:md w:md', ['w:md', 'h:md'], 'size:md'))
            .toBe('size:md w:md')
        expect(replaceClassGroupInClassList('h:md fg:red-60', ['w:md', 'h:md'], 'size:md'))
            .toBe('h:md fg:red-60')
        expect(replaceClassGroupInClassList('content:\\`\\` block', ['content:``', 'block'], 'content:none', { unescape: '`' }))
            .toBe('content:none')
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

describe('partial class conflicts', () => {
    test('splits margin axis classes when a later side overrides part of them', () => {
        expect(findPartialClassConflicts(['mx:md', 'ml:lg'], css)).toEqual([
            { className: 'mx:md', replacement: 'mr:md', conflict: 'ml:lg' }
        ])
        expect(findPartialClassConflicts(['mx:md', 'mr:lg'], css)).toEqual([
            { className: 'mx:md', replacement: 'ml:md', conflict: 'mr:lg' }
        ])
    })

    test('splits padding shorthand classes when a later axis overrides part of them', () => {
        expect(findPartialClassConflicts(['p:md', 'px:lg'], css)).toEqual([
            { className: 'p:md', replacement: 'py:md', conflict: 'px:lg' }
        ])
        expect(findPartialClassConflicts(['p:md', 'py:lg'], css)).toEqual([
            { className: 'p:md', replacement: 'px:md', conflict: 'py:lg' }
        ])
    })

    test('splits shorthand classes when a later side overrides part of them', () => {
        expect(findPartialClassConflicts(['m:md', 'mt:lg'], css)).toEqual([
            { className: 'm:md', replacement: 'mx:md mb:md', conflict: 'mt:lg' }
        ])
        expect(findPartialClassConflicts(['p:md', 'pl:lg'], css)).toEqual([
            { className: 'p:md', replacement: 'py:md pr:md', conflict: 'pl:lg' }
        ])
    })

    test('ignores different variants and fully overridden classes', () => {
        expect(findPartialClassConflicts(['mx:md', 'ml:lg@sm'], css)).toEqual([])
        expect(findPartialClassConflicts(['mx:md', 'mx:lg'], css)).toEqual([])
        expect(findPartialClassConflicts(['mx:md', 'm:lg'], css)).toEqual([])
    })

    test('splits physical inset shorthands when a later side overrides part of them', () => {
        expect(findPartialClassConflicts(['inset:md', 'top:lg'], css)).toEqual([
            { className: 'inset:md', replacement: 'right:md bottom:md left:md', conflict: 'top:lg' }
        ])
        expect(findPartialClassConflicts(['inset:md', 'left:lg'], css)).toEqual([
            { className: 'inset:md', replacement: 'top:md right:md bottom:md', conflict: 'left:lg' }
        ])
        expect(findPartialClassConflicts(['inset:md@sm', 'top:lg@sm'], css)).toEqual([
            { className: 'inset:md@sm', replacement: 'right:md@sm bottom:md@sm left:md@sm', conflict: 'top:lg@sm' }
        ])
    })

    test('splits radius shorthands when a later corner overrides part of them', () => {
        expect(findPartialClassConflicts(['r:md', 'rtl:lg'], css)).toEqual([
            { className: 'r:md', replacement: 'rtr:md rbr:md rbl:md', conflict: 'rtl:lg' }
        ])
        expect(findPartialClassConflicts(['r:md', 'rbr:lg'], css)).toEqual([
            { className: 'r:md', replacement: 'rtl:md rtr:md rbl:md', conflict: 'rbr:lg' }
        ])
        expect(findPartialClassConflicts(['border-radius:.375rem', 'border-top-left-radius:.5rem'], css)).toEqual([
            { className: 'border-radius:.375rem', replacement: 'rtr:md rbr:md rbl:md', conflict: 'border-top-left-radius:.5rem' }
        ])
    })

    test('splits border width shorthands when a later side overrides part of them', () => {
        expect(findPartialClassConflicts(['b:1px', 'bt:2px'], css)).toEqual([
            { className: 'b:1px', replacement: 'br:1px bb:1px bl:1px', conflict: 'bt:2px' }
        ])
        expect(findPartialClassConflicts(['b:0', 'bl:1px'], css)).toEqual([
            { className: 'b:0', replacement: 'bt:0 br:0 bb:0', conflict: 'bl:1px' }
        ])
        expect(findPartialClassConflicts(['border-width:1px', 'border-top-width:2px'], css)).toEqual([
            { className: 'border-width:1px', replacement: 'br:1px bb:1px bl:1px', conflict: 'border-top-width:2px' }
        ])
    })

    test('splits border color shorthands when a later side overrides part of them', () => {
        expect(findPartialClassConflicts(['b:red-60', 'bt:blue-60'], css)).toEqual([
            { className: 'b:red-60', replacement: 'br:red-60 bb:red-60 bl:red-60', conflict: 'bt:blue-60' }
        ])
        expect(findPartialClassConflicts(['border-color:red-60', 'border-left-color:blue-60'], css)).toEqual([
            { className: 'border-color:red-60', replacement: 'bt:red-60 br:red-60 bb:red-60', conflict: 'border-left-color:blue-60' }
        ])
    })

    test('splits border style shorthands when a later side overrides part of them', () => {
        expect(findPartialClassConflicts(['b-solid', 'bt-dashed'], css)).toEqual([
            { className: 'b-solid', replacement: 'br-solid bb-solid bl-solid', conflict: 'bt-dashed' }
        ])
        expect(findPartialClassConflicts(['border-style:solid', 'border-bottom-style:dotted'], css)).toEqual([
            { className: 'border-style:solid', replacement: 'bt-solid br-solid bl-solid', conflict: 'border-bottom-style:dotted' }
        ])
    })

    test('ignores unsupported partial conflict families', () => {
        expect(findPartialClassConflicts(['b:1px', 'bt:2px@sm'], css)).toEqual([])
        expect(findPartialClassConflicts(['b:1px', 'b:2px'], css)).toEqual([])
        expect(findPartialClassConflicts(['b:1px', 'bx:2px'], css)).toEqual([])
        expect(findPartialClassConflicts(['ix:md', 'ixs:lg'], css)).toEqual([])
        expect(findPartialClassConflicts(['r:md|lg', 'rtl:xl'], css)).toEqual([])
        expect(findPartialClassConflicts(['unknown-class', 'btn'], css)).toEqual([])
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

describe('raw value policy', () => {
    test('reports raw values in token-backed utilities', () => {
        expect(findUnapprovedRawValueClasses(['font:15px', 'm:17px', 'fg:#123456'], css)).toEqual([
            { className: 'font:15px', key: 'font', value: '15px', properties: ['font-size'] },
            { className: 'm:17px', key: 'm', value: '17px', properties: ['margin'] },
            { className: 'fg:#123456', key: 'fg', value: '#123456', properties: ['color'] }
        ])
    })

    test('ignores token, static, invalid, unknown, and component classes', () => {
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
        expect(findUnapprovedRawValueClasses([
            'font:md',
            'm:md',
            'm:md|lg',
            'fg:red-60',
            'text-center',
            'font:error',
            'unknown-class',
            'btn'
        ], componentCSS)).toEqual([])
    })

    test('allows raw values by property, key, pattern, or full opt-out', () => {
        expect(findUnapprovedRawValueClasses(['w:50%'], css, { allowProperties: ['width'] })).toEqual([])
        expect(findUnapprovedRawValueClasses(['w:50%'], css, { allowProperties: ['w'] })).toEqual([])
        expect(findUnapprovedRawValueClasses(['m:calc(1rem+1px)'], css, { allowedPatterns: ['^calc\\('] })).toEqual([])
        expect(findUnapprovedRawValueClasses(['font:15px'], css, { allowRawValues: true })).toEqual([])
    })

    test('applies raw value allowed patterns to individual multi-value segments', () => {
        expect(findUnapprovedRawValueClasses(['m:md|calc(1rem+1px)', 'm:calc(1rem+1px)|md'], css, {
            allowedPatterns: ['^calc\\(']
        })).toEqual([])
        expect(findUnapprovedRawValueClasses(['m:md|17px', 'm:calc(1rem+1px)|18px', 'm:19px|20px'], css, {
            allowedPatterns: ['^calc\\(']
        })).toEqual([
            { className: 'm:md|17px', key: 'm', value: '17px', properties: ['margin'] },
            { className: 'm:calc(1rem+1px)|18px', key: 'm', value: '18px', properties: ['margin'] },
            { className: 'm:19px|20px', key: 'm', value: '19px|20px', properties: ['margin'] }
        ])
    })

    test('uses active manifest tokens without treating registry fields as token namespaces', () => {
        expect(findUnapprovedRawValueClasses(['m:card', 'm:17px'], customCSS)).toEqual([
            { className: 'm:17px', key: 'm', value: '17px', properties: ['margin'] }
        ])
        expect(findUnapprovedRawValueClasses(['--space:17px'], registryFieldCSS)).toEqual([])
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

    test('suggests canonical condition suffix order', () => {
        expect(suggestCanonicalClassName('block@dark@sm', css)).toBe('block@sm@dark')
        expect(suggestCanonicalClassName('block:hover@dark@sm', css)).toBe('block:hover@sm@dark')
        expect(suggestCanonicalClassName('block!@dark@sm', css)).toBe('block!@sm@dark')
        expect(suggestCanonicalClassName('font:16px@dark@sm', css)).toBe('font:md@sm@dark')
        expect(suggestCanonicalClassName('text-align:center@dark@sm', css)).toBe('text-center@sm@dark')
    })

    test('combines condition order independently with canonical suggestion options', () => {
        expect(suggestCanonicalClassName('font:16px@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferConditionOrder: false
        })).toBe('font:md@dark@sm')
        expect(suggestCanonicalClassName('font:16px@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferThemeTokens: false
        })).toBe('font:16px@sm@dark')
        expect(suggestCanonicalClassName('font:16px@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferConditionOrder: false,
            preferThemeTokens: false
        })).toBeUndefined()
        expect(suggestCanonicalClassName('margin:md@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferPropertyAliases: false
        })).toBe('margin:md@sm@dark')
        expect(suggestCanonicalClassName('m:var(--spacing-md)@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferVariableReferences: false
        })).toBe('m:var(--spacing-md)@sm@dark')
        expect(suggestCanonicalClassName('m:1rem|1.5rem@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferMultiValueTokens: false
        })).toBe('m:1rem|1.5rem@sm@dark')
    })

    test('uses custom manifest modes, breakpoints, tokens, and utilities', () => {
        expect(suggestCanonicalClassName('block@midnight@tablet', customCSS)).toBe('block@tablet@midnight')
        expect(suggestCanonicalClassName('m:1.25rem@midnight@tablet', customCSS)).toBe('m:card@tablet@midnight')
        expect(suggestCanonicalClassName('content-visibility:auto', customCSS)).toBe('content-auto')
    })

    test('does not treat custom variants or component utilities as utilities-only canonical targets', () => {
        expect(customCSS.generate('block@midnight@wide')).toHaveLength(1)
        expect(suggestCanonicalClassName('block@midnight@wide', customCSS)).toBeUndefined()
        expect(suggestCanonicalClassName('btn@midnight@tablet', customCSS)).toBeUndefined()
    })

    test('ignores manifest-carried key alias and native namespace registry fields', () => {
        expect(suggestCanonicalClassName('margin:card', registryFieldCSS)).toBe('m:card')
        expect(suggestCanonicalClassName('--space:card', registryFieldCSS)).toBeUndefined()
    })

    test('does not suggest partial multi-value or unknown variable tokens', () => {
        expect(suggestCanonicalClassName('m:1rem|1.125rem', css)).toBeUndefined()
        expect(suggestCanonicalClassName('m:var(--spacing-unknown)', css)).toBeUndefined()
    })

    test('does not suggest unsafe condition or selector suffix order', () => {
        expect(suggestCanonicalClassName('block@sm:hover', css)).toBeUndefined()
        expect(suggestCanonicalClassName('block:focus:hover', css)).toBeUndefined()
        expect(suggestCanonicalClassName('block@start@sm', css)).toBeUndefined()
        expect(suggestCanonicalClassName('block@print@sm', css)).toBeUndefined()
        expect(suggestCanonicalClassName('block@supports(display:grid)@sm', css)).toBeUndefined()
        expect(suggestCanonicalClassName('font:error@dark@sm', css)).toBeUndefined()
        expect(suggestCanonicalClassName('unknown-class@dark@sm', css)).toBeUndefined()
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
        expect(suggestCanonicalClassName('block@dark@sm', css, {
            ...defaultCanonicalClassNameOptions,
            preferConditionOrder: false
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
        expect(suggestCanonicalClassName('btn@dark@sm', componentCSS)).toBeUndefined()
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

    test('suggests spacing axis composition utilities', () => {
        expect(suggestCanonicalClassGroups(['mt:md', 'mb:md'], css)).toEqual([
            { classNames: ['mt:md', 'mb:md'], recommended: 'my:md' }
        ])
        expect(suggestCanonicalClassGroups(['ml:md', 'mr:md'], css)).toEqual([
            { classNames: ['ml:md', 'mr:md'], recommended: 'mx:md' }
        ])
        expect(suggestCanonicalClassGroups(['pt:md', 'pb:md'], css)).toEqual([
            { classNames: ['pt:md', 'pb:md'], recommended: 'py:md' }
        ])
        expect(suggestCanonicalClassGroups(['pl:md', 'pr:md'], css)).toEqual([
            { classNames: ['pl:md', 'pr:md'], recommended: 'px:md' }
        ])
        expect(suggestCanonicalClassGroups(['mt:md:hover@sm', 'mb:md:hover@sm'], css)).toEqual([
            { classNames: ['mt:md:hover@sm', 'mb:md:hover@sm'], recommended: 'my:md:hover@sm' }
        ])
    })

    test('suggests spacing axis composition after canonicalization', () => {
        expect(suggestCanonicalClassGroups(['margin-top:md', 'margin-bottom:md'], css)).toEqual([
            { classNames: ['margin-top:md', 'margin-bottom:md'], recommended: 'my:md' }
        ])
        expect(suggestCanonicalClassGroups(['padding-left:1rem', 'padding-right:1rem'], css)).toEqual([
            { classNames: ['padding-left:1rem', 'padding-right:1rem'], recommended: 'px:md' }
        ])
        expect(suggestCanonicalClassGroups(['mt:md@dark@sm', 'mb:md@dark@sm'], css)).toEqual([
            { classNames: ['mt:md@dark@sm', 'mb:md@dark@sm'], recommended: 'my:md@sm@dark' }
        ])
    })

    test('does not suggest unsafe composition groups', () => {
        expect(suggestCanonicalClassGroups(['w:md', 'h:lg'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['w:md', 'h:md@sm'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['w:error', 'h:md'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['mt:md', 'mb:lg'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['mt:md', 'mb:md@sm'], css)).toEqual([])
        expect(suggestCanonicalClassGroups(['mt:error', 'mb:md'], css)).toEqual([])
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
