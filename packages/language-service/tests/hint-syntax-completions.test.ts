import { Position } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import getRange from '../src/utils/get-range'
import { Settings } from '../src/settings'
import dedent from 'ts-dedent'

const simulateHintingCompletions = (target: string, { quotes = true, settings }: { quotes?: boolean, settings?: Settings } = {}) => {
    const contents = [`<div class=${quotes ? '"' : ''}`, target, `${quotes ? '"' : ''}></div>`]
    const doc = createDoc('html', contents.join(''))
    const languageService = new CSSLanguageService(settings)
    return languageService.hintSyntaxCompletions(doc, { line: 0, character: contents[0].length } as Position, {
        triggerKind: 2, // todo
        triggerCharacter: target.charAt(target.length - 1)
    })
        /* localeCompare equals to the real vscode completion items sorting */
        ?.sort((a, b) => {
            const sortTextA = a.sortText || a.label
            const sortTextB = b.sortText || b.label
            return sortTextA.localeCompare(sortTextB)
        })
}

// it('types a', () => expect(simulateHintingCompletions('a')?.length).toBeDefined())

test.todo('following test require e2e -> packages/language-server')
// it('types " should hint completions', () => expect(simulateHintingCompletions('"', { quotes: false })?.length).toBeGreaterThan(0))
it('types   should hint completions', () => expect(simulateHintingCompletions('text:center ')?.length).toBeGreaterThan(0))
it('types "text:center" should not hint completions', () => expect(simulateHintingCompletions('text:center')?.length).toBe(0))

test.todo('types any trigger character in "" should not hint')
test.todo(`types any trigger character in '' should not hint`)

test.todo('keys')
// describe('keys', () => {
//     // it('should not hint selectors', () => expect(simulateHintingCompletions('text:')?.[0]).not.toMatchObject({ insertText: 'active' }))
//     test('@delay on invoked', () => expect(simulateHintingCompletions('"', { quotes: false })?.find(({ label }) => label === '@delay:')).toMatchObject({ label: '@delay:' }))
//     test('~delay on invoked', () => expect(simulateHintingCompletions('"', { quotes: false })?.find(({ label }) => label === '~delay:')).toMatchObject({ label: '~delay:' }))
//     it('starts with @', () => expect(simulateHintingCompletions('@')?.[0]).toMatchObject({ label: 'delay:' }))
//     it('starts with @d and list related', () => expect(simulateHintingCompletions('@d')?.map(({ label }) => label)).toEqual([
//         'delay:',
//         'direction:',
//         'duration:'
//     ]))
//     it('starts with @ and list related', () => expect(simulateHintingCompletions('@')?.map(({ label }) => label)).toEqual([
//         'delay:',
//         'direction:',
//         'duration:',
//         'easing:',
//         'fill-mode:',
//         'iteration-count:',
//         'name:',
//         'play-state:',
//     ]))
//     it('starts with ~', () => expect(simulateHintingCompletions('~')?.[0]).toMatchObject({ label: 'delay:' }))
//     it('starts with ~ and list related', () => expect(simulateHintingCompletions('~')?.map(({ label }) => label)).toEqual([
//         'delay:',
//         'duration:',
//         'easing:',
//         'property:'
//     ]))
// })

describe('semantics', () => {
    it('types a', () => expect(simulateHintingCompletions('a')?.find(({ label }) => label === 'abs')).toMatchObject({ label: 'abs' }))
    test('info', () => expect(simulateHintingCompletions('b')?.find(({ label }) => label === 'block')).toMatchObject({
        detail: 'display: block',
        documentation: {
            kind: 'markdown',
            value: dedent`
                \`\`\`css
                .block {
                  display: block
                }
                \`\`\`

                The element generates a block\\-level box
            `
        }
    }))
})

describe('styles', () => {
    const settings: Settings = {
        config: {
            styles: {
                btn: 'inline-block'
            }
        }
    }
    it('info', () => expect(simulateHintingCompletions('b', { settings })?.find(({ label }) => label === 'btn')).toMatchObject({
        detail: 'inline-block (style)',
        documentation: {
            kind: 'markdown',
            value: dedent`
                \`\`\`css
                .inline-block,
                .btn {
                  display: inline-block
                }
                \`\`\`
                \n
            `
        }
    }))
    it('types btn: and should not hint', () => expect(simulateHintingCompletions('btn:', { settings })).toBe(undefined))
})

describe('selectors', () => {
    test(':', () => expect(simulateHintingCompletions('text:center:')?.[0]).toMatchObject({ insertText: 'active' }))
    test('::', () => expect(simulateHintingCompletions('text:center::')?.[0]).toMatchObject({ insertText: 'after' }))
    // test('with semantic', () => expect(simulateHintingCompletions('block:')?.[0]).toMatchObject({ insertText: 'after' }))
    test('sorting', () => {
        expect(simulateHintingCompletions('text:center:')?.map(({ label }) => label)).toEqual([
            ':active',
            ':any-link',
            ':blank',
            ':checked',
            ':corner-present',
            ':current',
            ':decrement',
            ':default',
            ':defined',
            ':disabled',
            ':double-button',
            ':empty',
            ':enabled',
            ':end',
            ':first',
            ':first-child',
            ':first-of-type',
            ':focus',
            ':focus-visible',
            ':focus-within',
            ':fullscreen',
            ':future',
            ':horizontal',
            ':host',
            ':hover',
            ':in-range',
            ':increment',
            ':indeterminate',
            ':invalid',
            ':last-child',
            ':last-of-type',
            ':left',
            ':link',
            ':local-link',
            ':no-button',
            ':only-child',
            ':only-of-type',
            ':optional',
            ':out-of-range',
            ':past',
            ':paused',
            ':picture-in-picture',
            ':placeholder-shown',
            ':playing',
            ':read-only',
            ':read-write',
            ':required',
            ':right',
            ':root',
            ':scope',
            ':single-button',
            ':start',
            ':target',
            ':target-within',
            ':user-invalid',
            ':user-valid',
            ':valid',
            ':vertical',
            ':visited',
            ':window-inactive',
            ':dir()',
            ':has()',
            ':host-context()',
            ':host()',
            ':is()',
            ':lang()',
            ':matches()',
            ':not()',
            ':nth-child()',
            ':nth-last-child()',
            ':nth-last-of-type()',
            ':nth-of-type()',
            ':where()',
            ':-moz-any-link',
            ':-moz-broken',
            ':-moz-drag-over',
            ':-moz-first-node',
            ':-moz-focusring',
            ':-moz-full-screen',
            ':-moz-last-node',
            ':-moz-loading',
            ':-moz-only-whitespace',
            ':-moz-placeholder',
            ':-moz-submit-invalid',
            ':-moz-suppressed',
            ':-moz-ui-invalid',
            ':-moz-ui-valid',
            ':-moz-user-disabled',
            ':-moz-window-inactive',
            ':-ms-fullscreen',
            ':-ms-input-placeholder',
            ':-ms-keyboard-active',
            ':-webkit-full-screen',
            ':-moz-any()',
            ':-ms-lang()',
            ':-webkit-any()',
            '::after',
            '::backdrop',
            '::before',
            '::content',
            '::cue',
            '::cue-region',
            '::first-letter',
            '::first-line',
            '::grammar-error',
            '::marker',
            '::placeholder',
            '::selection',
            '::shadow',
            '::spelling-error',
            '::target-text',
            '::view-transition',
            '::view-transition-group',
            '::view-transition-image-pair',
            '::view-transition-new',
            '::view-transition-old',
            '::cue-region()',
            '::cue()',
            '::part()',
            '::slotted()',
            '::-moz-focus-inner',
            '::-moz-focus-outer',
            '::-moz-list-bullet',
            '::-moz-list-number',
            '::-moz-placeholder',
            '::-moz-progress-bar',
            '::-moz-range-progress',
            '::-moz-range-thumb',
            '::-moz-range-track',
            '::-moz-selection',
            '::-ms-backdrop',
            '::-ms-browse',
            '::-ms-check',
            '::-ms-clear',
            '::-ms-expand',
            '::-ms-fill',
            '::-ms-fill-lower',
            '::-ms-fill-upper',
            '::-ms-reveal',
            '::-ms-thumb',
            '::-ms-ticks-after',
            '::-ms-ticks-before',
            '::-ms-tooltip',
            '::-ms-track',
            '::-ms-value',
            '::-webkit-file-upload-button',
            '::-webkit-inner-spin-button',
            '::-webkit-input-placeholder',
            '::-webkit-keygen-select',
            '::-webkit-meter-bar',
            '::-webkit-meter-even-less-good-value',
            '::-webkit-meter-optimum-value',
            '::-webkit-meter-suboptimum-value',
            '::-webkit-outer-spin-button',
            '::-webkit-progress-bar',
            '::-webkit-progress-inner-element',
            '::-webkit-progress-inner-value',
            '::-webkit-progress-value',
            '::-webkit-resizer',
            '::-webkit-scrollbar',
            '::-webkit-scrollbar-button',
            '::-webkit-scrollbar-corner',
            '::-webkit-scrollbar-thumb',
            '::-webkit-scrollbar-track',
            '::-webkit-scrollbar-track-piece',
            '::-webkit-search-cancel-button',
            '::-webkit-search-decoration',
            '::-webkit-search-results-button',
            '::-webkit-search-results-decoration',
            '::-webkit-slider-runnable-track',
            '::-webkit-slider-thumb',
            '::-webkit-textfield-decoration-container',
            '::-webkit-validation-bubble',
            '::-webkit-validation-bubble-arrow',
            '::-webkit-validation-bubble-arrow-clipper',
            '::-webkit-validation-bubble-heading',
            '::-webkit-validation-bubble-message',
            '::-webkit-validation-bubble-text-block',
        ])
    })
})

describe('colors', () => {
    test('sorting', () => {
        // expect(simulateHintingCompletions('color:')?.map(({ label }) => label)).toEqual([])
    })
})

// enhanced

/**
 * <div></div> -> <div class=""></div>
 */
test.todo('emit class="" should hint completions')
test.todo('types { to hint completions for group syntax and fallback')