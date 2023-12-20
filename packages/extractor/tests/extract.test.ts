import { extractLatentClasses } from '../src'

it('extract latent classes from js raw', () => {
    const content = `
        import { setupCounter } from './counter'

        const counterElement = document.querySelector<HTMLButtonElement>('#counter')
        const syntax = 'block'
        counterElement?.classList.add('~transform|.3s', 'translateY(-5):hover', syntax)

        setupCounter(counterElement!)
    `
    expect(
        extractLatentClasses(content))
        .toEqual([
            'const',
            'counterElement',
            'syntax',
            'block',
            '~transform|.3s',
            'translateY(-5):hover',
            'setupCounter(counterElement!)',
        ])
})

test('basic js object', () => {
    expect(extractLatentClasses(`
    const test = {
        'f:24': true
    }
    `)).toEqual([
        'const',
        'test',
        'f:24',
        'true',
    ])
})

test('basic html', () => {
    expect(extractLatentClasses(`<div class="f:16 blur(2px) @shake|1s|infinite>li"></div>`)).toEqual(['f:16', 'blur(2px)', '@shake|1s|infinite>li'])
})

test('content', () => {
    expect(extractLatentClasses(`<div class="content:'I\\'m_string' content:'I\\'m_string2'"></div>`))
        .toEqual([
            'content:\'I\\\'m_string\'',
            'I',
            'm_string',
            'content:\'I\\\'m_string2\'',
            'm_string2'
        ])
})

test('url', () => {
    expect(extractLatentClasses(`<div class="bg:url('https://master.co/test_logo.png')"></div>`)).toEqual(['bg:url(\'https://master.co/test_logo.png\')'])
})

test('comment', () => {
    expect(extractLatentClasses(`<!-- comment -->
    /* bg:black */
    /*
        f:16
    */
    `)).toEqual([])
})

test('=', () => {
    expect(extractLatentClasses(`
    this={components[0]}
    data={data_0}>
    content:'='
    content:"="
    `)).toEqual([
        '{components[0]}',
        '{data_0}>',
        'content:\'=\'',
        'content:"="'
    ])
})

test('media', () => {
    expect(extractLatentClasses(`
    bg:black@xl
    font:24@media(min-width:1024px)
    font:16@<789
    font:16@<=789
    font:16@>=789
    font:16@>789
    @animation_test@>789
    `)).toEqual([
        'bg:black@xl',
        'font:24@media(min-width:1024px)',
        'font:16@<789',
        'font:16@<=789',
        'font:16@>=789',
        'font:16@>789',
        '@animation_test@>789'
    ])
})

test('wxh', () => {
    expect(extractLatentClasses(`
        min:40|80
        min:calc(100vw-60)xcalc(100vh-100px)
        calc(100vw-60)x20rem
        15pxxcalc(100vh-100px)
        calc(100vw-60)xcalc(100vh-100px)
        class="logo"
    `)).toEqual([
        'min:40|80',
        'min:calc(100vw-60)xcalc(100vh-100px)',
        'calc(100vw-60)x20rem',
        '15pxxcalc(100vh-100px)',
        'calc(100vw-60)xcalc(100vh-100px)',
        'logo'
    ])
})

test('group', () => {
    expect(extractLatentClasses(`
    {form}
    {:else}
    {data_0}
    {}
    {/if}
    {bg:black;f:16}_div@dark
    .something{bg:white}
    `))
        .toEqual([
            '{form}',
            '{data_0}',
            '{bg:black;f:16}_div@dark',
            '.something{bg:white}',
        ])
})

test('import', () => {
    expect(extractLatentClasses(`
        import * as fs from 'fs'
        import css from '@master/css'
        require('fs')
        await import('file:///')
    `))
        .toEqual(['await'])
})

test('style tag', () => {
    expect(extractLatentClasses(`<style data-sveltekit>.app.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{display:flex;flex-direction:column;min-height:100vh}main.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{flex:1;display:flex;flex-direction:column;padding:1rem;width:100%;max-width:64rem;margin:0 auto;box-sizing:border-box}footer.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{display:flex;flex-direction:column;justify-content:center;align-items:center;padding:12px}footer.s-7IPF32Wcq3s8 a.s-7IPF32Wcq3s8{font-weight:bold}@media(min-width: 480px){footer.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{padding:12px 0}}.s-7IPF32Wcq3s8.s-7IPF32Wcq3s8{}
/* fira-mono-cyrillic-ext-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-cyrillic-ext-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;
}
/* fira-mono-cyrillic-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-cyrillic-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;
}
/* fira-mono-greek-ext-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-greek-ext-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+1F00-1FFF;
}
/* fira-mono-greek-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-greek-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0370-03FF;
}
/* fira-mono-latin-ext-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-latin-ext-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0100-024F,U+0259,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20CF,U+2113,U+2C60-2C7F,U+A720-A7FF;
}
/* fira-mono-latin-400-normal*/
@font-face {
  font-family: 'Fira Mono';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-latin-400-normal.woff2') format('woff2'), url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-all-400-normal.woff') format('woff');
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
:root {
	--font-body: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
		Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	--font-mono: 'Fira Mono', monospace;
	--color-bg-0: rgb(202, 216, 228);
	--color-bg-1: hsl(209, 36%, 86%);
	--color-bg-2: hsl(224, 44%, 95%);
	--color-theme-1: #ff3e00;
	--color-theme-2: #40b3ff;
	--color-text: rgba(0, 0, 0, 0.7);
	--column-width: 42rem;
	--column-margin-top: 4rem;
	font-family: var(--font-body);
	color: var(--color-text);
}
</style>`
    )).toEqual([])
})


test('@', () => {
    expect(
        extractLatentClasses(`
        // @ts-ignore
        @font-face
        {
            font-family: 'Fira Mono';
            font-style: normal;
            font-display: swap;
            font-weight: 400;
            src: url('/@fs/Users/aron/master/css/node_modules/@fontsource/fira-mono/files/fira-mono-cyrillic-ext-400-normal.woff2');
            unicode-range: U+0460-052F,U+1C80-1C88,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F;
        }
        `)
    ).toEqual([
        'font-family',
        'Fira',
        'Mono',
        'font-style',
        'font-display',
        'font-weight',
        'src',
        'unicode-range',
    ])
})

test('home path', () => {
    expect(extractLatentClasses(`
        ~/assets/master.svg
        ~/master.svg
        ~padding|300ms|ease-in
        ~delay:0ms
        ~duration:.5ms
        ~easing:steps(6,end)
    `)).toEqual([
        '~padding|300ms|ease-in',
        '~delay:0ms',
        '~duration:.5ms',
        '~easing:steps(6,end)'
    ])
})

test('$', () => {
    expect(extractLatentClasses(`$(size):calc(100%-20px)`)).toEqual([])
})

test('comment2', () => {
    expect(extractLatentClasses(`
        // @todo
    `)).toEqual([])
})