import { test, expect } from 'vitest'
import { extractLatentClasses } from '../../src'

test('issue #337: extracts $name:$(custom-var) class from source', () => {
    const content = `<div class="$test:$(test-color) bg:white">x</div>`
    expect(extractLatentClasses(content)).toContain('$test:$(test-color)')
})

test('issue #337: extracts $name:$(custom-var) when standalone in attribute', () => {
    const content = `<div class="$test:$(test-color)">x</div>`
    expect(extractLatentClasses(content)).toContain('$test:$(test-color)')
})

test('issue #337: extracts $name:$(custom-var) from JS classList.add', () => {
    const content = `el.classList.add('$test:$(test-color)')`
    expect(extractLatentClasses(content)).toContain('$test:$(test-color)')
})
