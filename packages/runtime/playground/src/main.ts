import { initCSSRuntime } from '../../src'

initCSSRuntime({
    variables: {
        content: {
            external: '" ↗"'
        },
        first: {
            '': '#111111',
            '@dark': '#222222',
            '@light': '#333333'
        },
        second: {
            '@dark': '#444444',
            '@light': '#555555'
        },
        third: {
            '': '#666666',
            '@light': '#777777'
        },
        fourth: {
            '': '#888888',
            '@dark': '#999999',
            '@light': '#000000'
        },
        fifth: {
            '@dark': '#022222',
            '@light': '#033333'
        },
        sixth: {
            '@dark': '#666666'
        }
    }
})

// const a = document.getElementsByClassName('a')[0]
// const b = document.getElementsByClassName('b')[0]

// a.remove()
// document.body.appendChild(a)
// b.remove()
// a.appendChild(b)