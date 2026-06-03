import { RuleTester, RuleTesterConfig } from '@typescript-eslint/rule-tester'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { extendConfig } from '@master/css/utils'
import type { Config } from 'shared/css-config'
import themeConfig from '../../core/tests/helpers/test-theme-config'

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

function withThemeConfig(config: RuleTesterConfig): RuleTesterConfig {
    const settings = config.settings as Record<string, any> | undefined
    const masterCSSSettings = settings?.['@master/css'] || {}
    const configOption = masterCSSSettings.config as Config | undefined
    return {
        ...config,
        settings: {
            ...settings,
            '@master/css': {
                ...masterCSSSettings,
                config: configOption ? extendConfig(themeConfig, configOption) : themeConfig
            }
        }
    }
}

export const jsxTester = new RuleTester(withThemeConfig(configs.jsx))

export const createTester = (config: RuleTesterConfig, lang: keyof typeof configs = 'jsx') => {
    return new RuleTester(withThemeConfig({
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
