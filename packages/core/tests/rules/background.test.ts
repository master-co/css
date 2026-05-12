import { it, test, expect } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('background', () => {
    expect(createCSS().create('bg:black')?.text).toContain('background-color:var(--color-black)')
    expect(createCSS().create('bg:light-dark(#000,#fff)')?.text).toContain('background-color:light-dark(#000,#fff)')
    expect(createCSS().create('bg:#fff')?.text).toContain('background-color:#fff')
    expect(createCSS().create('bg:black:hover@md&landscape')?.text).toBe('@media (width>=64rem) and (orientation:landscape){.bg\\:black\\:hover\\@md\\&landscape:hover{background-color:var(--color-black)}}')
    expect(createCSS().create('bg:transparent')?.text).toContain('background-color:transparent')
    expect(createCSS().create('bg:current')?.text).toContain('background-color:var(--color-current)')
    expect(createCSS().create('bg-clip-border')?.text).toContain('background-clip:border-box')
    expect(createCSS().create('bg:url(\'#test\')')?.text).toContain('background-image:url(\'#test\')')
    expect(createCSS().create('bg:black|url(\'/images/wallpaper.jpg\')|no-repeat|top|left/cover')?.text).toContain('background:var(--color-black) url(\'/images/wallpaper.jpg\') no-repeat top left/cover')
    expect(createCSS().create('gradient(45deg,#f3ec78,#af4261)')?.text).toContain('background-image:linear-gradient(45deg,#f3ec78,#af4261)')
})

it.concurrent('gradient-related functions should keep color tokens as variables', () => {
    expect(createCSS().create('bg:conic-gradient(current,black)')?.text).toContain('background-image:conic-gradient(var(--color-current),var(--color-black))')
    expect(createCSS().create('bg:linear-gradient(current,black)')?.text).toContain('background-image:linear-gradient(var(--color-current),var(--color-black))')
    expect(createCSS().create('bg:radial-gradient(current,black)')?.text).toContain('background-image:radial-gradient(var(--color-current),var(--color-black))')
    expect(createCSS().create('bg:repeating-linear-gradient(current,black)')?.text).toContain('background-image:repeating-linear-gradient(var(--color-current),var(--color-black))')
    expect(createCSS().create('bg:repeating-radial-gradient(current,black)')?.text).toContain('background-image:repeating-radial-gradient(var(--color-current),var(--color-black))')
})
