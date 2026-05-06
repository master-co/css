import { describe, expect, it } from 'vitest'
import { UtilityType } from '@master/css'
import { compileCSS } from '../src'

function process(css: string, classes?: string[]) {
    return compileCSS(css, { classes }).css
}

describe.concurrent('@master/css-compiler', () => {
    it('generates variables, components, utilities, at tokens, selector tokens, screens, modes, and animations', () => {
        const result = compileCSS(`
            @master {
                root-size: 16;
                base-unit: 4;
                default-mode: light;
                mode-trigger: media;
                important: false;
                scope: #app;

                --color-primary: #123;
                --color-base: #fff;
                --color-ring: #e5e7eb;
                --radius-card: 12;
                --spacing-card: 24;
                --screen-md: 768;

                @at motion-safe @media (prefers-reduced-motion: no-preference);
                @at supports-backdrop @supports (backdrop-filter: blur(0));
                @selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                    --color-base: #000;
                }
            }

            @master components {
                .btn {
                    @compose "ai:center jc:center px:1rem py:.5rem bg:primary r:card";
                    display: inline-flex;
                }

                .card {
                    @compose "p:card bg:base r:card content-auto @fade-in|1s@motion-safe";
                    border: 1px solid var(--color-ring);
                }

                .card::before {
                    @compose "{content:'';abs;inset:0}";
                }
            }

            @master animations {
                fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(.5rem);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }

            @master utilities {
                .content-auto {
                    content-visibility: auto;
                    contain-intrinsic-size: auto 32rem;
                }
            }
        `, { classes: ['btn', 'card', 'block@md', 'w:10::scrollbar', 'bg:base@dark', 'backdrop-filter:blur(16)@supports-backdrop'] })

        expect(result.css).toContain('@layer base,theme,preset,components,utilities;')
        expect(result.css).toContain('#app .btn{border-radius:0.75rem}')
        expect(result.css).toContain('#app .btn{padding-left:1rem;padding-right:1rem}')
        expect(result.css).toContain('#app .btn{padding-top:0.5rem;padding-bottom:0.5rem}')
        expect(result.css).toContain('#app .btn{align-items:center}')
        expect(result.css).toContain('#app .btn{background-color:var(--color-primary)}')
        expect(result.css).toContain('#app .btn{justify-content:center}')
        expect(result.css).toContain('#app .btn{display:inline-flex}')
        expect(result.css).toContain('#app .card{content-visibility:auto;contain-intrinsic-size:auto 32rem}')
        expect(result.css).toContain('#app .card:before{content:\'\'')
        expect(result.css).toContain('@media (width>=48rem){#app .block\\@md{display:block}}')
        expect(result.css).toContain('#app .w\\:10\\:\\:scrollbar::-webkit-scrollbar')
        expect(result.css).toContain('@media (prefers-reduced-motion:no-preference)')
        expect(result.css).toContain('@supports (backdrop-filter:blur(0))')
        expect(result.css).toContain('@media (prefers-color-scheme:dark){:root{--color-base:rgb(0 0 0)}}')
        expect(result.css).toContain('@keyframes fade-in')
        expect(result.warnings).toEqual([])
    })

    it('compiles CSS directives into a reusable config result', () => {
        const result = compileCSS(`
            @master {
                root-size: 10;
                base-unit: 8;
                mode-trigger: class;

                --color-primary: #123;
                --screen-md: 768;

                @at motion-safe @media (prefers-reduced-motion: no-preference);
                @selector ::scrollbar ::-webkit-scrollbar;

                dark {
                    --color-primary: #456;
                }
            }

            @master components {
                .btn {
                    @compose "bg:primary block@dark";
                    display: inline-flex;
                }
            }

            @master utilities {
                .content-auto {
                    content-visibility: auto;
                }
            }
        `)

        expect(result.config).toMatchObject({
            rootSize: 10,
            baseUnit: 8,
            modeTrigger: 'class',
            variables: [
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#123'
                },
                {
                    namespace: 'screen',
                    key: 'md',
                    value: 768
                },
                {
                    namespace: 'color',
                    key: 'primary',
                    value: '#456',
                    mode: 'dark'
                }
            ],
            components: {
                btn: [
                    'bg:primary',
                    'block@dark',
                    {
                        selector: '&',
                        declarations: {
                            display: 'inline-flex'
                        }
                    }
                ]
            },
            utilities: [
                {
                    name: 'content-auto',
                    type: UtilityType.Static,
                    declarations: {
                        'content-visibility': 'auto'
                    }
                }
            ],
            atTokens: {
                'motion-safe': 'media(prefers-reduced-motion:no-preference)'
            },
            selectorTokens: {
                '::scrollbar': '::-webkit-scrollbar'
            }
        })
        expect(result.componentNames).toEqual(['btn'])
        expect(result.config.modes).toBeUndefined()
        expect(result.generatedCSS).toBe('')
        expect(result.css).toBe('')
    })

    it('keeps light and dark as core defaults and auto-registers custom modes', () => {
        const result = compileCSS(`
            @master {
                mode-trigger: class;

                --color-primary: #123;

                dark {
                    --color-primary: #456;
                }

                chrisma {
                    --color-primary: #ff0;
                }
            }
        `, { classes: ['bg:primary@dark', 'bg:primary@chrisma'] })

        expect(result.config.modes).toEqual(['chrisma'])
        expect(result.css).toContain('.dark .bg\\:primary\\@dark{background-color:rgb(68 85 102)}')
        expect(result.css).toContain('.chrisma .bg\\:primary\\@chrisma{background-color:rgb(255 255 0)}')
    })

    it('supports @master components as an organizational section', () => {
        const css = process(`
            @master {
                --color-primary: #123;
            }

            @master components {
                .btn {
                    @compose "block bg:primary";
                }
            }
        `, ['btn'])

        expect(css).toContain('.btn{display:block}')
        expect(css).toContain('.btn{background-color:rgb(17 34 51)}')
    })

    it('supports shorthand animation blocks in @master animations', () => {
        const css = process(`
            @master animations {
                fade {
                    50% {
                        opacity: .5;
                    }

                    to {
                        opacity: 1;
                    }
                }

                @keyframes reveal {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }
            }
        `, ['@fade|1s', '@reveal|1s'])

        expect(css).toContain('@keyframes fade')
        expect(css).toContain('50%{opacity:.5}')
        expect(css).toContain('@keyframes reveal')
    })

    it('warns when regular HTML selectors are placed in @master', () => {
        const warnings: string[] = []
        const result = compileCSS(`
            @master {
                body {
                    margin: 0;
                }

                html {
                    color-scheme: light dark;
                }
            }
        `, { onWarning: (warning) => warnings.push(warning) })

        expect(result.warnings).toHaveLength(2)
        expect(warnings).toEqual(result.warnings)
        expect(result.warnings[0]).toContain('Unsupported @master block "body"')
        expect(result.warnings[1]).toContain('Unsupported @master block "html"')
    })

    it('warns when component selectors are placed in @master root', () => {
        const result = compileCSS(`
            @master {
                .btn {
                    @compose "block";
                    display: inline-flex;
                }
            }
        `)

        expect(result.warnings).toHaveLength(1)
        expect(result.warnings[0]).toContain('Component definitions must be placed in @master components')
        expect(result.config.components).toBeUndefined()
    })

    it('rejects @keyframes in @master root', () => {
        expect(() => process(`
            @master {
                @keyframes fade {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }
            }
        `)).toThrow('@keyframes is only allowed in @master animations')
    })

    it('rejects @compose outside component definitions', () => {
        expect(() => process(`
            .btn {
                @compose "block";
            }
        `)).toThrow('@compose is only allowed in @master components')
    })

    it('rejects invalid @at and @selector names and conflicts', () => {
        expect(() => process(`
            @master {
                @at @motion-safe @media (prefers-reduced-motion: no-preference);
            }
        `)).toThrow('@at names must not start with "@"')

        expect(() => process(`
            @master {
                @at :headings :is(h1, h2, h3);
            }
        `)).toThrow('@at names cannot be selector tokens')

        expect(() => process(`
            @master {
                @selector headings :is(h1, h2, h3);
            }
        `)).toThrow('@selector names must start with ":" or "::"')

        expect(() => process(`
            @master {
                @at dark @media (prefers-color-scheme: dark);
            }
        `)).toThrow('@at "dark" conflicts with mode "dark"')

        expect(() => process(`
            @master {
                @at md @media (width >= 48rem);
            }
        `)).toThrow('@at "md" conflicts with screen variable "--screen-md"')

        expect(() => process(`
            @master {
                md {
                    --color-primary: #ff0;
                }
            }
        `)).toThrow('Mode "md" conflicts with screen variable "--screen-md"')
    })

    it('rejects @at and @selector outside @master', () => {
        expect(() => process(`
            @at motion-safe @media (prefers-reduced-motion: no-preference);
        `)).toThrow('@at is only allowed in @master')

        expect(() => process(`
            @selector :headings :is(h1, h2, h3);
        `)).toThrow('@selector is only allowed in @master')
    })
})
