
import { ESLintUtils } from '@typescript-eslint/utils'

export default ESLintUtils.RuleCreator(
    (name) => new URL(`/guide/code-linting#${name}`, 'https://rc.css.master.co').href
)