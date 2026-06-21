import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createPresetManifest } from './helpers/create-preset-manifest'
import type { MasterCSSManifest } from '@master/css'

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

function withPresetManifest(config: RuleTesterConfig): RuleTesterConfig {
    const settings = config.settings as Record<string, any> | undefined
    const masterCSSSettings = settings?.['@master/css'] || {}
    const planOption = masterCSSSettings.manifest as Partial<MasterCSSManifest> | undefined
    return {
        ...config,
        settings: {
            ...settings,
            '@master/css': {
                ...masterCSSSettings,
                manifest: createPresetManifest(planOption)
            }
        }
    }
}

export const jsxTester = new RuleTester(withPresetManifest(configs.jsx))

export const createTester = (config: RuleTesterConfig, lang: keyof typeof configs = 'jsx') => {
    return new RuleTester(withPresetManifest({
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
