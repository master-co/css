import { masterCSS } from '@master/eslint-plugin-css'
import type { Linter } from 'eslint'

export const recommended: Linter.Config[] = masterCSS.configs.recommended

export default recommended
