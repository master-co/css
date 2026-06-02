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

test.concurrent('animation and transition shorthand tokens', () => {
    expect(createCSSWithTheme().create('@fade|fast|smooth')?.declarations).toStrictEqual({ animation: 'fade var(--duration-fast) var(--easing-smooth)' })
    expect(createCSSWithTheme().create('~opacity|faster|crisp')?.declarations).toStrictEqual({ transition: 'opacity var(--duration-faster) var(--easing-crisp)' })
})
