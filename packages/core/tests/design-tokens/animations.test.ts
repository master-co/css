import { expect, test } from 'vitest'
import createCSSWithTheme from '../helpers/create-css-with-theme'
test.concurrent('duration tokens', () => {
    expect(createCSSWithTheme().create('@duration:fastest')).toBeUndefined()
    expect(createCSSWithTheme().create('~duration:slower')).toBeUndefined()
    expect(createCSSWithTheme().create('animation-duration:fastest')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fastest)' })
    expect(createCSSWithTheme().create('animation-duration:fast')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fast)' })
    expect(createCSSWithTheme().create('animation-duration:duration-fast')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-fast)' })
    expect(createCSSWithTheme().create('animation-duration:slowest')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-slowest)' })
    expect(createCSSWithTheme().create('transition-duration:slower')?.declarations).toStrictEqual({ 'transition-duration': 'var(--duration-slower)' })
})

test.concurrent('duration longhands do not use property namespace variables', () => {
    const css = createCSSWithTheme({
        variables: [
            { namespace: 'duration', key: 'quick', value: '120ms' },
            { namespace: 'animation-duration', key: 'quick', value: '990ms' },
            { namespace: 'transition-duration', key: 'quick', value: '880ms' }
        ]
    })

    expect(css.create('animation-duration:quick')?.declarations).toStrictEqual({ 'animation-duration': 'var(--duration-quick)' })
    expect(css.create('transition-duration:quick')?.declarations).toStrictEqual({ 'transition-duration': 'var(--duration-quick)' })
})

test.concurrent('easing tokens', () => {
    expect(createCSSWithTheme().create('@easing:smooth')).toBeUndefined()
    expect(createCSSWithTheme().create('~easing:crisp')).toBeUndefined()
    expect(createCSSWithTheme().create('animation-timing-function:smooth')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-smooth)' })
    expect(createCSSWithTheme().create('animation-timing-function:overshoot')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-overshoot)' })
    expect(createCSSWithTheme().create('transition-timing-function:crisp')?.declarations).toStrictEqual({ 'transition-timing-function': 'var(--easing-crisp)' })
})

test.concurrent('timing function longhands do not use property namespace variables', () => {
    const css = createCSSWithTheme({
        variables: [
            { namespace: 'easing', key: 'fluid', value: 'cubic-bezier(.4,0,.2,1)' },
            { namespace: 'animation-timing-function', key: 'fluid', value: 'steps(2,end)' },
            { namespace: 'transition-timing-function', key: 'fluid', value: 'steps(3,end)' }
        ]
    })

    expect(css.create('animation-timing-function:fluid')?.declarations).toStrictEqual({ 'animation-timing-function': 'var(--easing-fluid)' })
    expect(css.create('transition-timing-function:fluid')?.declarations).toStrictEqual({ 'transition-timing-function': 'var(--easing-fluid)' })
})

test.concurrent('delay tokens', () => {
    const css = createCSSWithTheme({
        variables: [{ namespace: 'delay', key: 'stagger', value: '80ms' }]
    })

    expect(css.create('animation-delay:stagger')?.declarations).toStrictEqual({ 'animation-delay': 'var(--delay-stagger)' })
    expect(css.create('transition-delay:stagger')?.declarations).toStrictEqual({ 'transition-delay': 'var(--delay-stagger)' })
    expect(css.create('transition-delay:delay-stagger')?.declarations).toStrictEqual({ 'transition-delay': 'var(--delay-stagger)' })
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
