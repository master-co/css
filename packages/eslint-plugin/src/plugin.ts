import classCollision from './rules/class-collision'
import classOrder from './rules/class-order'
import classRecommendation from './rules/class-recommendation'
import classValidation from './rules/class-validation'
import { readFileSync } from 'fs'
import type { TSESLint } from '@typescript-eslint/utils'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'))

const plugin = {
    meta: {
        name: pkg.name,
        version: pkg.version
    },
    rules: {
        'class-collision': classCollision,
        'class-order': classOrder,
        'class-recommendation': classRecommendation,
        'class-validation': classValidation
    }
} as TSESLint.Linter.Plugin

export default plugin
