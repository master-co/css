import type { Config } from 'shared/css-config'
import { resolveConfigPath, warnMissingConfig } from '@master/css-configer/path'

export function warnMissingNextConfig(projectDir: string, config: string | Config) {
    if (typeof config !== 'string') return
    if (resolveConfigPath({ cwd: projectDir, name: config })) return
    warnMissingConfig({
        integration: '@master/css.next',
        name: config,
        cwd: projectDir
    })
}
