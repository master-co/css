import { extractLatentClasses } from '../src'

it('extract latent classes from js raw', () => {
    const content = `
        import { setupCounter } from './counter'

        const counterElement = document.querySelector<HTMLButtonElement>('#counter')
        const syntax = 'block'
        counterElement?.classList.add('~transform|.3s', 'translateY(-5):hover', syntax)

        setupCounter(counterElement!)
    `
    expect(extractLatentClasses(content)).toEqual(['block', '~transform|.3s', 'translateY(-5):hover', 'setupCounter(counterElement!)'])
})