import css from '@master/eslint-plugin-css'
import type { Linter } from 'eslint'

const recommended: Linter.Config[] = [
    css.configs.recommended,
    css.configs.stylesheet
]

export default recommended
