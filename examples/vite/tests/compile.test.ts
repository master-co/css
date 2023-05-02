import { ChildProcess, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { cssEscape } from '../../../packages/css/src/utils/css-escape'
import { runViteDevProcess } from '../../vite/tests/run-vite-dev-process'
import puppeteer, { type Browser, type Page } from 'puppeteer'
import dedent from 'ts-dedent'

let devProcess: ChildProcess
let browser: Browser
let page: Page

const indexHtmlPath = path.resolve(__dirname, '../index.html')
const originalIndexHtml = dedent`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + Master CSS</title>
</head>

<body>
    <div id="app">
        <div>
            <div class="flex center-content">
                <a href="https://vitejs.dev" target="_blank">
                    <img src="/vite.svg" class="logo" alt="Vite logo" />
                </a>
                <a href="https://css.master.co" target="_blank">
                    <img src="/master.svg" class="logo 172x172" alt="Master logo" />
                </a>
            </div>
            <h1 class="font:sans ls:.25 fg:white">Vite v4 + Master CSS v2</h1>
            <div class="card hmr-test">
                <button id="counter" type="button" class="btn fg:white"></button>
            </div>
            <p class="read-the-docs">
                Click on the Vite and Master CSS logos to learn more
            </p>
        </div>
    </div>
    <script type="module" src="/src/main.ts"></script>
</body>

</html>`

const cssConfigPath = path.resolve(__dirname, '../master.css.mjs')
const originalCssConfig = dedent`const config = {
    colors: {
        primary: {
            '': 'blue-50',
            code: '#777777',
            stage: {
                '1': '#999999'
            }
        },
        input: {
            '': '#123456'
        }
    },
    classes: {
        btn: 'bg:blue'
    },
    themes: {
        light: {
            colors: {
                primary: {
                    '': '#ebbb40',
                    stage: {
                        '1': '#888888'
                    }
                },
                accent: 'gold-70',
                major: 'slate-10',
                content: 'slate-30',
                fade: 'slate-55'
            },
            classes: {
                btn: 'bg:primary fg:white font:semibold',
                blue: {
                    btn: 'f:20'
                }
            }
        },
        dark: {
            colors: {
                primary: {
                    '': '#fbe09d',
                    code: 'gray',
                    stage: {
                        '1': '#AAAAAA'
                    }
                },
                accent: '#fbe09d',
                major: 'gray-80',
                content: 'gray-60',
                fade: 'gray-60'
            },
            classes: {
                btn: 'bg:white fg:primary font:medium'
            }
        }
    },
    rules: {
        width: {
            values: {
                x: {
                    '1': {
                        '1': '25rem',
                        '2': '50rem',
                        '3': '75rem'
                    },
                    '2': '100rem'
                }
            }
        },
        fontSize: {
            values: {
                sm: 16,
                md: 20
            }
        },
        letterSpacing: {
            values: {
                wide: .4
            }
        },
        border: {
            values: {
                'inputborder': '2|solid|red'
            }
        },
        boxShadow: {
            values: {
                '2x': '0 25px 50px -12px rgb(0 0 0 / 25%)'
            }
        },
        inset: {
            values: {
                sm: 10,
                md: 20
            }
        }
    },
    values: {
        '2x': '32',
        '3x': '3rem'
    },
    semantics: {
        show: {
            display: 'block'
        },
        'hide-text': {
            'font-size': '0px'
        },
        zero: {
            h: {
                'height': 0
            },
            'font-size': '0px',
            height: '0px'
        }
    },
    breakpoints: {
        tablet: 768,
        laptop: 1024,
        desktop: 1280,
        custom: {
            '1': 2500
        }
    },
    selectors: {
        '>custom': '>div>:first+button',
        '_custom': '::before,::after',
        '~custom': {
            '1': '~div'
        }
    },
    mediaQueries: {
        watch: '(max-device-width:42mm) and (min-device-width:38mm)',
        device: {
            watch: '(max-device-width:42mm) and (min-device-width:38mm)'
        }
    },
    rootSize: 16
}

export default config
`

beforeAll(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()
    devProcess = await runViteDevProcess(page)
}, 30000) // 30s timeout for the slow windows OS

it('check if the browser contains [data-vite-dev-id="master.css"]', async () => {
    expect(await page.$('[data-vite-dev-id$="master.css"]')).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const newClassName = 'font:' + new Date().getTime()
    const newClassNameSelector = '.' + cssEscape(newClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtml.replace('hmr-test', newClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    const styleHandle = await page.$('[data-vite-dev-id$="master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newClassNameSelector)
})

it('change master.css.mjs and check result in the browser during HMR', async () => {
    const newBtnClassName = 'btn' + new Date().getTime()
    const newBtnClassNameSelector = '.' + cssEscape(newBtnClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtml.replace('hmr-test', newBtnClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newBtnClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    // -> classes: { btn43848384: 'xxx' }
    fs.writeFileSync(cssConfigPath, originalCssConfig.replace(/btn:/, newBtnClassName + ':'))
    await new Promise((x) => setTimeout(x, 1000))
    await page.waitForNetworkIdle()
    const styleHandle = await page.$('[data-vite-dev-id$="master.css"]')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newBtnClassNameSelector)
})

afterAll(async () => {
    fs.writeFileSync(indexHtmlPath, originalIndexHtml)
    fs.writeFileSync(cssConfigPath, originalCssConfig)
    devProcess.stdout?.destroy()
    devProcess.kill()
    await page.close()
    await browser.close()
}, 30000) // 30s timeout for the slow windows OS
