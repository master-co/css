import noConflictingClasses from './rules/no-conflicting-classes'
import noInvalidClasses from './rules/no-invalid-classes'
import preferCanonicalClasses from './rules/prefer-canonical-classes'
import sortClasses from './rules/sort-classes'
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
        'no-conflicting-classes': noConflictingClasses,
        'no-invalid-classes': noInvalidClasses,
        'prefer-canonical-classes': preferCanonicalClasses,
        'sort-classes': sortClasses
    }
} as TSESLint.Linter.Plugin

export default plugin
