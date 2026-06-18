import { expect, test } from 'vitest'
import { extractLatentClasses } from '../src'

test.concurrent('extracts class candidates from mixed source strings', () => {
    const source = `
        import styles from './style.css'
        const cls = "fg:red hover:bg:blue"
        const nested = { class: 'content:"a;b" bg:url("/logo.png")' }
    `

    expect(extractLatentClasses(source)).toEqual([
        'const',
        'cls',
        'fg:red',
        'hover:bg:blue',
        'nested',
        'class',
        'content:"a;b"',
        'a;b',
        'bg:url("/logo.png")'
    ])
})

test.concurrent('keeps grouped class candidates before downstream validation', () => {
    expect(extractLatentClasses('<div class="{fg:red;bg:blue}" data-id="${id}"></div>')).toEqual([
        '{fg:red;bg:blue}',
        '${id}'
    ])
})

test.concurrent('keeps native custom property declarations without legacy dollar assignments', () => {
    expect(extractLatentClasses('<div class="--token:1rem $token:1rem"></div>')).toEqual([
        '--token:1rem'
    ])
})
