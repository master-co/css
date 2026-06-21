import { test, it, expect, describe } from 'vitest'
import { expectClassPosition } from './test'

test.concurrent('class in ternary operator', () => {
    const target = 'class-a'
    const contents = ['<div class={ isActive ? \'', target, '\' : inactiveClass }></div>']
    expectClassPosition(target, contents, 'svelte')
})

/**
 * ? svelte's 'class:xx={isActive}' is not supported
 */