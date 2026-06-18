import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'
import { CompletionItemKind } from 'vscode-languageserver-protocol'
import { createPresetPlan } from '../helpers/create-preset-plan'

test.todo('convert any color spaces to RGB and hint correctly')

it('should ignore values containing blanks', () => expect(hint('font-family:')?.map(({ label }) => label)).not.toContain('Arial, Helvetica, sans-serif'))
it('types | delimiter', () => expect(hint('b:1|')?.map(({ label }) => label)).toContain('solid'))
it('types , separator', () => expect(hint('shadow:1|1|2|black,')?.map(({ label }) => label)).toContain('inset'))
it('ends with @ and not to hint values', () => expect(hint('text:center@')?.map(({ label }) => label)).not.toContain('center'))
it('ends with : and not to hint values', () => expect(hint('text:center:')?.map(({ label }) => label)).not.toContain('center'))

describe('ambiguous', () => {
    test('text:capitalize', () => expect(hint('text:')?.map(({ label }) => label)).toContain('capitalize'))
    test('text:center', () => expect(hint('text:')?.map(({ label }) => label)).toContain('center'))
})

describe('detail and documentation', () => {
    test('font:', () => expect(hint('font:')?.find(({ label }) => label === 'sans')).toEqual({
        detail: '(scope) var(--font-sans, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"',
        kind: CompletionItemKind.Value,
        label: 'sans',
        sortText: 'aaaasans',
        documentation: {
            kind: 'markdown',
            value: dedent`
                    \`\`\`css
                    @layer theme {
                      :root {
                        --font-family-sans: var(--font-sans, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                        --font-sans: "Inter"
                      }
                    }
                    @layer utilities {
                      .font\\:sans {
                        font-family: var(--font-family-sans)
                      }
                    }
                    \`\`\`
                `
        }
    }))
    test('font-style:', () => expect(hint('font-style:')?.find(({ label }) => label === 'italic')).toEqual({
        detail: 'font-style: italic',
        kind: 12,
        label: 'italic',
        sortText: 'cccccitalic',
        documentation: {
            kind: 'markdown',
            value: dedent`
                    \`\`\`css
                    @layer utilities {
                      .font-style\\:italic {
                        font-style: italic
                      }
                    }
                    \`\`\`
                `
        }
    }))
})

describe('retype on no hints', () => {
    it('"text:c"', () => expect(hint('text:c')?.length).toBeGreaterThan(0))
    it('"display:b"', () => expect(hint('display:b')?.find(({ label }) => label === 'block')).toMatchObject({
        label: 'block',
        kind: 12,
        sortText: 'cccccblock',
        detail: 'display: block'
    }))
})

describe('negative values', () => {
    it('should hint negative values', () => expect(hint('font:')?.map(({ label }) => label)).not.toContain('-bold'))
    test.todo('types - to hint number values')
})

describe('key aliases', () => {
    test('radius alias values use canonical radius utility', () => {
        expect(hint('rtr:')?.map(({ label }) => label)).toContain('md')
    })

    test('native value namespace alias values use canonical property namespace', () => {
        expect(hint('w:')?.map(({ label }) => label)).toContain('sm')
        expect(hint('width:')?.map(({ label }) => label)).toContain('sm')
    })
})

describe('sorting', () => {
    test('colors', () => {
        expect(
            hint('fg:')
                ?.filter(({ label }) => label.startsWith('yellow'))
                ?.map(({ label }) => label)
        ).toEqual([
            'yellow-0',
            'yellow-5',
            'yellow-10',
            'yellow-20',
            'yellow-30',
            'yellow-40',
            'yellow-50',
            'yellow-60',
            'yellow-70',
            'yellow-80',
            'yellow-90',
            'yellow-95',
            'yellow-100',
            'yellow',
            'yellow-focus',
            'yellow-hover',
            'yellow-line',
            'yellow-pressed',
            'yellow-selection',
            'yellow-surface'
        ])
    })

    test('color roles', () => {
        expect(hint('fg:')?.map(({ label }) => label)).toEqual(expect.arrayContaining([
            'accent',
            'danger',
            'link',
            'muted',
            'strong',
            'text'
        ]))
    })

    test('unitful numeric variables', () => {
        const labels = new Set(['test-tiny', 'test-small', 'test-medium'])
        expect(
            hint('w:', {
                plan: createPresetPlan({
                    variables: [
                        {
                            name: 'container-test-medium',
                            namespace: 'container',
                            key: 'test-medium',
                            type: 'number',
                            value: '2rem',
                            numeric: { value: 2, unit: 'rem' }
                        },
                        {
                            name: 'container-test-tiny',
                            namespace: 'container',
                            key: 'test-tiny',
                            type: 'number',
                            value: '8px',
                            numeric: { value: 8, unit: 'px' }
                        },
                        {
                            name: 'container-test-small',
                            namespace: 'container',
                            key: 'test-small',
                            type: 'number',
                            value: '1rem',
                            numeric: { value: 1, unit: 'rem' }
                        }
                    ]
                })
            })
                ?.filter(({ label }) => labels.has(label))
                ?.map(({ label }) => label)
        ).toEqual([
            'test-tiny',
            'test-small',
            'test-medium'
        ])
    })
})

describe('functions', () => {
    test.todo('fucntions')
})
