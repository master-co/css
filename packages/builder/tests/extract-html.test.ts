import { test, expect, it } from 'vitest'
import { extractLatentClasses } from '../src'

it('extract latent classes from html', () => {
    const content = `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/vite.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Master CSS Static Extraction in Vite</title>
        </head>

        <body>
            <div id="app">
                <div>
                    <div class="flex center-content">
                        <a href="https://vitejs.dev" target="_blank">
                            <img src="/vite.svg" class="logo" alt="Vite logo" />
                        </a>
                        <a href="https://css.master.co" target="_blank">
                            <img src="/master.svg" class="logo size:172" alt="Master logo" />
                        </a>
                    </div>
                    <h1
                        class="font:sans tracking:-.25 fg:white@dark font:heavy">
                        <span class="gradient-text bg:linear-gradient(120deg,#bd34fe|30%,#41d1ff)">Vite</span>
                        <span class="fg:slate-70 mx:10 font:semibold">+</span>
                        <span>Master CSS</span>
                    </h1>
                    <div class="card">
                        <button id="counter" type="button" class="fg:white@dark"></button>
                    </div>
                    <p class="read-the-docs">
                        Click on the Vite and Master CSS logos to learn more
                    </p>
                </div>
            </div>
            <script type="module" src="src/main.ts"></script>
        </body>

        </html>
    `
    expect(
        extractLatentClasses(content))
        .toEqual([
            'html>',
            'en',
            'UTF-8',
            'icon',
            'image/svg+xml',
            'viewport',
            'device-width,',
            '1.0',
            'CSS',
            'Static',
            'Extraction',
            'in',
            'app',
            'flex',
            'center-content',
            '_blank',
            'logo',
            'Vite',
            'size:172',
            'Master',
            'font:sans',
            'tracking:-.25',
            'fg:white@dark',
            'font:heavy',
            'gradient-text',
            'bg:linear-gradient(120deg,#bd34fe|30%,#41d1ff)',
            'fg:slate-70',
            'mx:10',
            'font:semibold',
            'card',
            'counter',
            'button',
            'read-the-docs',
            'Click',
            'on',
            'the',
            'and',
            'logos',
            'to',
            'learn',
            'more',
            'module',
            'src/main.ts'
        ])
})
