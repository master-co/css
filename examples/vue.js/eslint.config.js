import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'node:url'
import vue from 'eslint-plugin-vue'
import vueTS from '@vue/eslint-config-typescript'
import css from '@master/eslint-config-css'

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url))

export default [
    includeIgnoreFile(gitignorePath),
    ...vue.configs['flat/essential'],
    ...vueTS(),
    css
]
