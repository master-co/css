import { initCSSRuntime } from '../../src'

initCSSRuntime({
    variables: {
        content: {
            external: '" ↗"'
        }
    }
})

// const a = document.getElementsByClassName('a')[0]
// const b = document.getElementsByClassName('b')[0]

// a.remove()
// document.body.appendChild(a)
// b.remove()
// a.appendChild(b)