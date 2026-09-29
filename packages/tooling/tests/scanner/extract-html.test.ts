import { test, expect, it } from 'vitest'
import { extractClassCandidates } from './extract-class-candidates'

it('extract latent classes from html', () => {
  const content = "\n    <!DOCTYPE html>\n    <html lang=\"en\">\n\n    <head>\n      <meta charset=\"UTF-8\" />\n      <link rel=\"icon\" type=\"image/svg+xml\" href=\"/vite.svg\" />\n      <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n      <title>Master CSS Static Rendering in Vite</title>\n    </head>\n\n    <body>\n      <div id=\"app\">\n        <div>\n          <div class=\"display:flex\">\n            <a href=\"https://vitejs.dev\" target=\"_blank\">\n              <img src=\"/vite.svg\" class=\"logo\" alt=\"Vite logo\" />\n            </a>\n            <a href=\"https://css.master.co\" target=\"_blank\">\n              <img src=\"/master.svg\" class=\"logo size:10.75rem\" alt=\"Master logo\" />\n            </a>\n          </div>\n          <h1\n            class=\"font-sans tracking-tight fg-white@dark font-heavy\">\n            <span class=\"text-gradient background-image:linear-gradient(120deg,#bd34fe|30%,#41d1ff)\">Vite</span>\n            <span class=\"fg-slate-70 margin-inline:0.625rem font-medium\">+</span>\n            <span>Master CSS</span>\n          </h1>\n          <div class=\"card\">\n            <button id=\"counter\" type=\"button\" class=\"fg-white@dark\"></button>\n          </div>\n          <p class=\"read-the-docs\">\n            Click on the Vite and Master CSS logos to learn more\n          </p>\n        </div>\n      </div>\n      <script type=\"module\" src=\"src/main.ts\"></script>\n    </body>\n\n    </html>\n  "
  expect(
    extractClassCandidates(content))
    .toEqual([
      'en',
      'UTF-8',
      'icon',
      'image/svg+xml',
      'viewport',
      'device-width,',
      '1.0',
      'CSS',
      'Static',
      'Rendering',
      'in',
      'app',
      "display:flex",
      '_blank',
      'logo',
      'Vite',
      'size:10.75rem',
      'Master',
      'font-sans',
      'tracking-tight',
      'fg-white@dark',
      'font-heavy',
      'text-gradient',
      'background-image:linear-gradient(120deg,#bd34fe|30%,#41d1ff)',
      'fg-slate-70',
      "margin-inline:0.625rem",
      'font-medium',
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
