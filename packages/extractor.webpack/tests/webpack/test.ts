import { ChildProcess, exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { cssEscape } from '../../../css/src/utils/css-escape'
import puppeteer, { type Browser, type Page } from 'puppeteer'
import dedent from 'ts-dedent'
import stripAnsi from 'strip-ansi'

let devProcess: ChildProcess
let browser: Browser
let page: Page
let error: Error

const indexHtmlPath = path.resolve(__dirname, 'src/index.html')
const originalIndexHtml = dedent`<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8" />
</head>

<body>
    <div id="app">
        <div>
            <h1 class="font:sans ls:.25 fg:white">Webpack + Master CSS v2</h1>
            <div class="card hmr-test">
                <button id="counter" type="button" class="btn fg:white"></button>
            </div>
        </div>
    </div>
</body>

</html>`

const cssConfigPath = path.resolve(__dirname, 'master.css.js')
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
    fs.writeFileSync(indexHtmlPath, originalIndexHtml)
    fs.writeFileSync(cssConfigPath, originalCssConfig)
    browser = await puppeteer.launch({ headless: 'new' })
    page = await browser.newPage()
    page.on('console', (consoleMessage) => {
        if (consoleMessage.type() === 'error') {
            error = new Error(consoleMessage.text())
        }
    })
    page.on('pageerror', (e) => error = e)
    page.on('error', (e) => error = e)
    devProcess = await new Promise((resolve) => {
        const devProcess = exec('webpack serve --mode=development', { cwd: __dirname })
        devProcess.stderr?.on('data', async (data) => {
            const message = stripAnsi(data)
            const result = /(http:\/\/localhost:).*?([0-9]+)/.exec(message)
            if (result) {
                await page.goto(result[1] + result[2])
                resolve(devProcess)
            }
        })
        devProcess.stdout?.on('data', (data) => {
            console.log(data)
        })
    })
}, 30000) // 30s timeout for the slow windows OS

it('run dev without errors', () => {
    expect(() => { if (error) throw error }).not.toThrowError()
})

it('check if the page\'s <style> startsWith /*HMR:master.css*/', async () => {
    expect(
        await page.evaluate(() => {
            const styleElement = document.querySelector('style') // 替換成你要查詢的樣式元素的選擇器
            if (styleElement) {
                const cssText = styleElement?.textContent?.trim()
                return cssText?.startsWith('/*HMR:master.css*/')
            }
            return false
        })
    ).toBeTruthy()
})

it('change class names and check result in the browser during HMR', async () => {
    const newClassName = 'font:' + new Date().getTime()
    const newClassNameSelector = '.' + cssEscape(newClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtml.replace('hmr-test', newClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    const styleHandle = await page.$('style')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newClassNameSelector)
})

it('change master.css.js and check result in the browser during HMR', async () => {
    const newBtnClassName = 'btn' + new Date().getTime()
    const newBtnClassNameSelector = '.' + cssEscape(newBtnClassName)
    fs.writeFileSync(indexHtmlPath, originalIndexHtml.replace('hmr-test', newBtnClassName))
    await page.waitForNetworkIdle()
    const newClassNameElementHandle = await page.waitForSelector(newBtnClassNameSelector)
    expect(newClassNameElementHandle).not.toBeNull()
    // -> classes: { btn43848384: 'xxx' }
    fs.writeFileSync(cssConfigPath, originalCssConfig.replace(/btn:/, newBtnClassName + ':'))
    await page.waitForNetworkIdle()
    const styleHandle = await page.$('style')
    expect(styleHandle).not.toBeNull()
    const cssText = await page.evaluate((style: any) => (style as HTMLStyleElement)?.textContent, styleHandle)
    expect(cssText).toContain(newBtnClassNameSelector)
})

afterAll(async () => {
    devProcess.stdout?.destroy()
    devProcess.kill()
    await page.close()
    await browser.close()
}, 30000) // 30s timeout for the slow windows OS
