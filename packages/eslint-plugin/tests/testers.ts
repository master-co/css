import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createPresetPlan } from './helpers/create-preset-plan'
import type { MasterCSSPlan } from '@master/css'

const configs = {
    jsx: {
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                }
            }
        }
    }
} satisfies Record<string, RuleTesterConfig>

function withPresetPlan(config: RuleTesterConfig): RuleTesterConfig {
    const settings = config.settings as Record<string, any> | undefined
    const masterCSSSettings = settings?.['@master/css'] || {}
    const planOption = masterCSSSettings.plan as Partial<MasterCSSPlan> | undefined
    return {
        ...config,
        settings: {
            ...settings,
            '@master/css': {
                ...masterCSSSettings,
                plan: createPresetPlan(planOption)
            }
        }
    }
}

export const jsxTester = new RuleTester(withPresetPlan(configs.jsx))

export const createTester = (config: RuleTesterConfig, lang: keyof typeof configs = 'jsx') => {
    return new RuleTester(withPresetPlan({
        ...configs[lang],
        ...config
    }))
}

export const source = (name: string, base: string) => {
    const filename = fileURLToPath(new URL(name, base))
    return {
        name: filename,
        filename,
        code: readFileSync(filename, 'utf-8'),
    }
}
