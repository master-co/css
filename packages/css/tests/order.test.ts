import { expectOrderOfRules } from './css'
import shuffle from 'shuffle-array'

it('checks that different input sources should have the same output', () => {
    const input = [
        'px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0',
        'mx:0', 'ml:0', 'mr:0', 'm:0', 'mt:0', 'mb:0', 'my:0',
        'font:12',
        'font:semibold',
        'text:center',
        'fixed',
        'block',
        'round',
        'b:0'
    ]
    const output = [
        // semantics
        'block',
        'fixed',
        'round',
        // native shorthand
        'b:0',
        'm:0',
        'p:0',
        // custom shorthand
        'mx:0',
        'my:0',
        'px:0',
        'py:0',
        // native
        'font:12',
        'font:semibold',
        'mb:0',
        'ml:0',
        'mr:0',
        'mt:0',
        'pb:0',
        'pl:0',
        'pr:0',
        'pt:0',
        'text:center',
        // custom
    ]
    for (let i = 0; i < 10; i++) {
        expectOrderOfRules(shuffle([...input]), output)
    }
})