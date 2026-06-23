import type { MasterCSSManifest } from '@master/css'
import { Page } from '@playwright/test'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function init(page: Page, text?: string, manifest?: MasterCSSManifest) {
    await page.evaluate(({ manifest, runtimeStyleId, text }) => {
        if (manifest) window.masterCSSManifest = manifest
        if (text) {
            const style = document.createElement('style')
            style.id = runtimeStyleId
            style.textContent = text
            document.head.appendChild(style)
        }
    }, { manifest, runtimeStyleId: MASTER_CSS_RUNTIME_STYLE_ID, text })
    await page.addScriptTag({ path: resolve(__dirname, '../dist/global.min.js') })
}
