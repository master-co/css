import { Page } from '@playwright/test'
import { compileCSSConfigFile } from '@master/css-compiler'
import { extendConfig } from '@master/css/utils'
import type { Config } from 'shared/css-config'
import { createMasterCSSPlan } from 'shared/master-css-plan'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const defaultPlanEntry = resolve(__dirname, '../../core/src/index.css')
const defaultPlanConfig = compileCSSConfigFile(defaultPlanEntry).config

export default async function init(page: Page, text?: string, config?: Config) {
    const plan = config ? createMasterCSSPlan(extendConfig(defaultPlanConfig, config)) : undefined
    await page.evaluate(({ plan, text }) => {
        if (plan) window.masterCSSPlan = plan
        if (text) {
            const style = document.createElement('style')
            style.id = 'master'
            style.textContent = text
            document.head.appendChild(style)
        }
    }, { plan, text })
    await page.addScriptTag({ path: resolve(__dirname, '../dist/global.min.js') })
}
