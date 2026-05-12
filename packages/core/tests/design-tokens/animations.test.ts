import { expect, test } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('duration tokens', () => {
    expect(createCSS().create('@duration:fastest')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fastest)' })
    expect(createCSS().create('@duration:fast')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fast)' })
    expect(createCSS().create('@duration:slowest')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-slowest)' })
    expect(createCSS().create('~duration:slower')?.declarations).toStrictEqual({ 'transition-duration': 'var(--duration-slower)' })
})

test.concurrent('easing tokens', () => {
    expect(createCSS().create('@easing:smooth')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-smooth)' })
    expect(createCSS().create('@easing:overshoot')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-overshoot)' })
    expect(createCSS().create('~easing:crisp')?.declarations).toStrictEqual({ 'transition-timing-function': 'var(--easing-crisp)' })
})

test.concurrent('animation and transition shorthand tokens', () => {
    expect(createCSS().create('@fade|fast|smooth')?.declarations).toStrictEqual({ animation: 'fade var(--duration-fast) var(--easing-smooth)' })
    expect(createCSS().create('~opacity|faster|crisp')?.declarations).toStrictEqual({ transition: 'opacity var(--duration-faster) var(--easing-crisp)' })
})
