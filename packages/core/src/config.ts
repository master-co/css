// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../master-css-config.d.ts" />

import themeConfig from '../theme.css?master-css-config'
import functions from './functions'
import utilities from './utilities'
import extendConfig from './utils/extend-config'
import type { Config } from 'shared/css-config'

const config = {
    ...themeConfig,
    utilities: extendConfig(
        { utilities },
        { utilities: themeConfig.utilities }
    ).utilities || [],
    functions,
} satisfies Config

export default config
