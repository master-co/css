import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './test'

describe.concurrent('pseudo-class', () => {
    test.concurrent(':', () => expect(hint('text:center:')?.map(({ label }) => label)).toContain(':active'))
    test.concurrent('two', () => expect(hint('text:center:hover:')?.map(({ label }) => label)).toContain(':active'))
    test.concurrent('utility', () => expect(hint('block:')?.map(({ label }) => label)).toContain(':active'))
    it.concurrent('should take into account trigger character :', () => expect(hint('text:center:')?.find(({ label }) => label === ':active')).toMatchObject({ insertText: 'active' }))
    it.concurrent('should take into account trigger character +', () => expect(hint('text:center+')?.find(({ label }) => label === ':active')?.insertText).toBeUndefined())
    test.concurrent('info', () => expect(hint('block:')?.find(({ label }) => label === ':first')).toEqual({
        'data': {
            'browsers': [
                'E12',
                'FF3',
                'S3.1',
                'C4',
                'IE7',
                'O9.5',
            ],
            'description': 'Same as :nth-child(1). Represents an element that is the first child of some other element.',
            'name': ':first-child',
            'references': [
                {
                    'name': 'MDN Reference',
                    'url': 'https://developer.mozilla.org/docs/Web/CSS/:first-child',
                },
            ],
        },
        'detail': ':first-child',
        'documentation': {
            'kind': 'markdown',
            'value': dedent`
                \`\`\`css
                @layer general {
                  .block\\:first:first-child {
                    display: block
                  }
                }
                \`\`\`

                Same as :nth\\-child\\(1\\)\\. Represents an element that is the first child of some other element\\.

                (Edge 12, Firefox 3, Safari 3, Chrome 4, IE 7, Opera 9)

                [Master CSS](https://rc.css.master.co/guide/selectors) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/:first-child)
            `,
        },
        'insertText': 'first',
        'kind': 3,
        'label': ':first',
        'sortText': 'yyfirst',
    }))
})

describe.concurrent('pseudo-element', () => {
    test.concurrent('::', () => expect(hint('text:center::')?.map(({ label }) => label)).toContain('::after'))
    test.concurrent('two', () => expect(hint('text:center::after::')?.map(({ label }) => label)).toContain('::after'))
    test.concurrent('utility', () => expect(hint('block::')?.map(({ label }) => label)).toContain('::after'))
    it.concurrent('should take into account trigger character :', () => expect(hint('text:center:')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: ':after' }))
    it.concurrent('should take into account trigger character ::', () => expect(hint('text:center::')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: 'after' }))
    it.concurrent('should take into account trigger character +', () => expect(hint('text:center+')?.find(({ label }) => label === '::after')?.insertText).toBeUndefined())
    test.concurrent('info', () => expect(hint('block::')?.find(({ label }) => label === '::placeholder')).toEqual({
        'data': {
            'browsers': [
                'E79',
                'FF51',
                'S10.1',
                'C57',
                'O44',
            ],
            'description': 'The ::placeholder CSS pseudo-element represents the placeholder text of a form element.',
            'name': '::placeholder',
            'references': [
                {
                    'name': 'MDN Reference',
                    'url': 'https://developer.mozilla.org/docs/Web/CSS/::placeholder',
                },
            ],
        },
        'documentation': {
            'kind': 'markdown',
            'value': dedent`\`\`\`css
                @layer general {
                  .block\\:\\:placeholder::placeholder {
                    display: block
                  }
                }
                \`\`\`

                The ::placeholder CSS pseudo\\-element represents the placeholder text of a form element\\.

                (Edge 79, Firefox 51, Safari 10, Chrome 57, Opera 44)

                [Master CSS](https://rc.css.master.co/guide/selectors) | [MDN Reference](https://developer.mozilla.org/docs/Web/CSS/::placeholder)
         `,
        },
        'insertText': 'placeholder',
        'kind': 3,
        'label': '::placeholder',
        'sortText': 'zzplaceholder',
    }))
})

test.concurrent('sorting', () => {
    expect(hint('text:center:')?.map(({ label }) => label)).toEqual([
        ':active',
        ':any-link',
        // ':blank',
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
        ':even',
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
        ':last',
        ':last-child',
        ':last-of-type',
        // ':left',
        ':link',
        ':local-link',
        ':ltr',
        ':no-button',
        ':nth',
        ':odd',
        ':of',
        ':only',
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
        // ':right',
        ':root',
        ':rtl',
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
        '::progress',
        '::resizer',
        '::scrollbar',
        '::scrollbar-button',
        '::scrollbar-corner',
        '::scrollbar-thumb',
        '::scrollbar-track',
        '::scrollbar-track-piece',
        '::selection',
        '::shadow',
        '::slider-runnable-track',
        '::slider-thumb',
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

test.todo('types _ should hint')