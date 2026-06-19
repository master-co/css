import { test, expect } from 'vitest'
import { extractLatentClasses } from '../../src'

test('issue #337: extracts --name:var(--custom-var) class from source', () => {
    const content = `<div class="--test:var(--test-color) bg:white">x</div>`
    expect(extractLatentClasses(content)).toContain('--test:var(--test-color)')
})

test('issue #337: extracts --name:var(--custom-var) when standalone in attribute', () => {
    const content = `<div class="--test:var(--test-color)">x</div>`
    expect(extractLatentClasses(content)).toContain('--test:var(--test-color)')
})

test('issue #337: extracts --name:var(--custom-var) from JS classList.add', () => {
    const content = `el.classList.add('--test:var(--test-color)')`
    expect(extractLatentClasses(content)).toContain('--test:var(--test-color)')
})
