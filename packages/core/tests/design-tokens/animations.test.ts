import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('duration tokens', () => {
    expect(createCSSWithTheme().create('@duration:fastest')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fastest)' })
    expect(createCSSWithTheme().create('@duration:fast')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fast)' })
    expect(createCSSWithTheme().create('@duration:slowest')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-slowest)' })
    expect(createCSSWithTheme().create('~duration:slower')?.declarations).toStrictEqual({ 'transition-duration': 'var(--duration-slower)' })
})

test.concurrent('easing tokens', () => {
    expect(createCSSWithTheme().create('@easing:smooth')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-smooth)' })
    expect(createCSSWithTheme().create('@easing:overshoot')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-overshoot)' })
    expect(createCSSWithTheme().create('~easing:crisp')?.declarations).toStrictEqual({ 'transition-timing-function': 'var(--easing-crisp)' })
})

test.concurrent('animation tokens', () => {
    const css = createCSSWithTheme().add('animation:float')

    expect(css.create('animation:float')?.declarations).toStrictEqual({ animation: 'var(--animation-float)' })
    expect(css.themeLayer.text).toContain(':root{--animation-float:float 3s ease-in-out infinite}')
    expect(css.animationsNonLayer.text).toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
})

test.concurrent('animation and transition shorthand tokens', () => {
    expect(createCSSWithTheme().create('@fade|fast|smooth')).toBeUndefined()
    expect(createCSSWithTheme().create('~opacity|faster|crisp')).toBeUndefined()
    expect(createCSSWithTheme().create('animation:fade|fast|smooth')?.declarations).toStrictEqual({ animation: 'fade var(--duration-fast) var(--easing-smooth)' })
    expect(createCSSWithTheme().create('transition:opacity|faster|crisp')?.declarations).toStrictEqual({ transition: 'opacity var(--duration-faster) var(--easing-crisp)' })
})
