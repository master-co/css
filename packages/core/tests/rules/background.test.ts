import { it, test, expect } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('background', () => {
    expect(createCSSWithTheme().create('bg:black')?.text).toContain('background-color:var(--color-black)')
    expect(createCSSWithTheme().create('bg:light-dark(#000,#fff)')?.text).toContain('background-color:light-dark(#000,#fff)')
    expect(createCSSWithTheme().create('bg:#fff')?.text).toContain('background-color:#fff')
    expect(createCSSWithTheme().create('bg:black:hover@md&landscape')?.text).toBe('@media (width>=64rem) and (orientation:landscape){.bg\\:black\\:hover\\@md\\&landscape:hover{background-color:var(--color-black)}}')
    expect(createCSSWithTheme().create('bg:transparent')?.text).toContain('background-color:transparent')
    expect(createCSSWithTheme().create('bg:current')?.text).toContain('background-color:var(--color-current)')
    expect(createCSSWithTheme().create('bg:line-light')?.text).toContain('background-color:var(--color-line-light)')
    expect(createCSSWithTheme().create('bg-clip-border')?.text).toContain('background-clip:border-box')
    expect(createCSSWithTheme().create('bg:url(\'#test\')')?.text).toContain('background-image:url(\'#test\')')
    expect(createCSSWithTheme().create('bg:black|url(\'/images/wallpaper.jpg\')|no-repeat|top|left/cover')?.text).toContain('background:var(--color-black) url(\'/images/wallpaper.jpg\') no-repeat top left/cover')
    expect(createCSSWithTheme().create('gradient(45deg,#f3ec78,#af4261)')?.text).toContain('background-image:linear-gradient(45deg,#f3ec78,#af4261)')
})

it.concurrent('gradient-related functions should keep color tokens as variables', () => {
    expect(createCSSWithTheme().create('bg:conic-gradient(current,black)')?.text).toContain('background-image:conic-gradient(var(--color-current),var(--color-black))')
    expect(createCSSWithTheme().create('bg:linear-gradient(current,black)')?.text).toContain('background-image:linear-gradient(var(--color-current),var(--color-black))')
    expect(createCSSWithTheme().create('bg:radial-gradient(current,black)')?.text).toContain('background-image:radial-gradient(var(--color-current),var(--color-black))')
    expect(createCSSWithTheme().create('bg:repeating-linear-gradient(current,black)')?.text).toContain('background-image:repeating-linear-gradient(var(--color-current),var(--color-black))')
    expect(createCSSWithTheme().create('bg:repeating-radial-gradient(current,black)')?.text).toContain('background-image:repeating-radial-gradient(var(--color-current),var(--color-black))')
})
