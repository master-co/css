import { expect, test } from 'vitest'
import { createCSS } from '../../src'

test.concurrent('duration tokens', () => {
    expect(createCSS().create('@duration:fastest')?.declarations).toStrictEqual({ 'animation-duration': '75ms' })
    expect(createCSS().create('@duration:fast')?.declarations).toStrictEqual({ 'animation-duration': '150ms' })
    expect(createCSS().create('@duration:slowest')?.declarations).toStrictEqual({ 'animation-duration': '800ms' })
    expect(createCSS().create('~duration:slower')?.declarations).toStrictEqual({ 'transition-duration': '500ms' })
})

test.concurrent('easing tokens', () => {
    expect(createCSS().create('@easing:smooth')?.declarations).toStrictEqual({ 'animation-timing-function': 'cubic-bezier(0.4,0,0.2,1)' })
    expect(createCSS().create('@easing:overshoot')?.declarations).toStrictEqual({ 'animation-timing-function': 'cubic-bezier(0.34,1.56,0.64,1)' })
    expect(createCSS().create('~easing:crisp')?.declarations).toStrictEqual({ 'transition-timing-function': 'cubic-bezier(0.16,1,0.3,1)' })
})

test.concurrent('animation and transition shorthand tokens', () => {
    expect(createCSS().create('@fade|fast|smooth')?.declarations).toStrictEqual({ animation: 'fade 150ms cubic-bezier(0.4,0,0.2,1)' })
    expect(createCSS().create('~opacity|faster|crisp')?.declarations).toStrictEqual({ transition: 'opacity 100ms cubic-bezier(0.16,1,0.3,1)' })
})
