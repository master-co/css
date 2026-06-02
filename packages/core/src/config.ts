// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../master-css-config.d.ts" />

import functions from './functions'
import utilities from './utilities'
import type { Config } from 'shared/css-config'

const config = {
    rootSize: 16,
    baseUnit: 4,
    defaultMode: 'light',
    modeTrigger: 'media',
    modes: ['light', 'dark'],
    utilities,
    functions,
} satisfies Config

export default config
