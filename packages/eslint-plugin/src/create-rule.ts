
import { OFFICIAL_URL } from '@master/css'
import { ESLintUtils } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator(
    (name) => new URL(`/guide/code-linting#${name}`, OFFICIAL_URL).href
)