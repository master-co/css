import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import masterCSS from '../src'

async function process(css: string) {
    return (await postcss([masterCSS()]).process(css, { from: undefined })).css
}

describe.concurrent('@master/postcss', () => {
    it('generates variables, utilities, components, selectors, screens, at-rules, and animations', async () => {
        const css = (await postcss([masterCSS({
            classes: ['block@md', 'w:10::scrollbar', '@fade-in|1s@motion-safe']
        })]).process(`
            @master {
                root-size: 16;
                base-unit: 4;
                default-mode: light;
                mode-trigger: media;
                important: false;

                --color-primary: #123;
                --color-base: #fff;
                --radius-card: 12;
                --screen-md: 48;
            }

            @mode dark {
                --color-primary: #456;
                --color-bg: #000;
            }

            @at motion-safe @media (prefers-reduced-motion: no-preference);
            @selector ::scrollbar ::-webkit-scrollbar;

            @layer components {
                .btn {
                    @apply "ai:center jc:center px:1rem py:.5rem bg:primary r:card content-auto";
                    display: inline-flex;
                }

                .card {
                    @apply "p:1rem bg:base r:card";
                }
            }

            @layer utilities {
                .content-auto {
                    content-visibility: auto;
                    contain-intrinsic-size: auto 500px;
                }
            }

            @keyframes fade-in {
                from {
                    opacity: 0;
                    transform: translateY(.5rem);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `, { from: undefined })).css

        expect(css).toContain('@layer base,theme,preset,components,general;')
        expect(css).toContain('@layer components')
        expect(css).toContain('.btn{content-visibility:auto;contain-intrinsic-size:auto 500px}')
        expect(css).toContain('.btn{border-radius:0.75rem}')
        expect(css).toContain('.btn{padding-left:1rem;padding-right:1rem}')
        expect(css).toContain('.btn{padding-top:0.5rem;padding-bottom:0.5rem}')
        expect(css).toContain('.btn{align-items:center}')
        expect(css).toContain('.btn{background-color:var(--color-primary)}')
        expect(css).toContain('.btn{justify-content:center}')
        expect(css).toContain('.btn{display:inline-flex}')
        expect(css).toContain('content-visibility:auto')
        expect(css).toContain('border-radius:0.75rem')
        expect(css).toContain('@media (width>=3rem){.block\\@md{display:block}}')
        expect(css).toContain('.w\\:10\\:\\:scrollbar::-webkit-scrollbar')
        expect(css).toContain('@media (prefers-reduced-motion:no-preference)')
        expect(css).toContain('@keyframes fade-in')
    })

    it('binds custom variables to generated rules', async () => {
        const css = (await postcss([masterCSS({ classes: ['bg:primary'] })]).process(`
            @master {
                --color-primary: oklch(62% 0.18 250);
            }
        `, { from: undefined })).css

        expect(css).toContain('background-color:oklch(62% 0.18 250)')
    })

    it('uses the longest matching variable namespace', async () => {
        const css = (await postcss([masterCSS({ classes: ['font-family:brand'] })]).process(`
            @master {
                --font-family-brand: ui-serif, Georgia;
            }
        `, { from: undefined })).css

        expect(css).toContain('font-family:ui-serif, Georgia')
    })

    it('supports dotted definition names', async () => {
        const css = await process(`
            @layer utilities {
                .content-auto {
                    content-visibility: auto;
                }
            }

            @layer components {
                .btn {
                    @apply "content-auto";
                }
            }
        `)

        expect(css).toContain('.btn{content-visibility:auto}')
    })

    it('rejects @apply inside @utility', async () => {
        await expect(process(`
            @layer utilities {
                .content-auto {
                    @apply "block";
                }
            }
        `)).rejects.toThrow('Utilities only accept declarations')
    })

    it('applies master options to the CSS instance', async () => {
        const css = await process(`
            @master {
                root-size: 10;
                base-unit: 8;
                important: true;
            }

            @layer components {
                .box {
                    @apply "p:4 w:1x";
                }
            }
        `)

        expect(css).toContain('.box{padding:0.4rem!important}')
        expect(css).toContain('.box{width:0.8rem!important}')
    })
})
