import { describe, expect, test } from 'vitest'
import { MasterCSS, variables } from '../src'

describe('comp -> comp -> var', () => {
    const css = new MasterCSS({
        components: {
            badge: {
                primary: 'strong-primary',
            },
            strong: {
                primary: 'bg:primary fg:primary-text outline:1|primary-active'
            }
        },
        variables: {
            primary: { '@light': '$(black)', '@dark': '$(white)' },
            'primary-text': { '@light': '$(white)', '@dark': '$(black)' },
            'primary-active': { '@light': '$(gray)', '@dark': '$(white)' }
        }
    })
    css.add('badge-primary')
    test('badge with common strong comp', () => {
        expect(css.text).toMatchSnapshot()
    })
})