// @ts-expect-error
import { CSSDataProvider } from 'vscode-css-languageservice/lib/umd/languageFacts/dataProvider'
// @ts-expect-error
import { cssData } from 'vscode-css-languageservice/lib/umd/data/webCustomData'
import type { ICSSDataProvider } from 'vscode-css-languageservice/lib/umd/cssLanguageTypes'

const cssDataProvider = new CSSDataProvider(cssData) as ICSSDataProvider

export default cssDataProvider