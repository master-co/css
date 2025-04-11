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
            'baseline': {
                'baseline_high_date': '2018-01-29',
                'baseline_low_date': '2015-07-29',
                'status': 'high'
            },
            'browsers': [
                'E12',
                'FF3',
                'FFA4',
                'S3.1',
                'SM4',
                'C4',
                'CA18',
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

                (Edge 12, Firefox 3,  4, Safari 3,  4, Chrome 4,  18, IE 7, Opera 9)

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
            'baseline': {
                'baseline_high_date': '2022-07-15',
                'baseline_low_date': '2020-01-15',
                'status': 'high'
            },
            'browsers': [
                'E79',
                'FF51',
                'FFA51',
                'S10.1',
                'SM10.3',
                'C57',
                'CA57',
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

                (Edge 79, Firefox 51,  51, Safari 10,  10, Chrome 57,  57, Opera 44)

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
    expect(hint('text:center:')?.length).toBeGreaterThan(200)
})

test.todo('types _ should hint')