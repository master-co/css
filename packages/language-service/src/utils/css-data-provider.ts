// @ts-expect-error
import { CSSDataProvider } from 'vscode-css-languageservice/lib/umd/languageFacts/dataProvider.js'
// @ts-expect-error
import { cssData } from 'vscode-css-languageservice/lib/umd/data/webCustomData.js'
import type { ICSSDataProvider } from 'vscode-css-languageservice/lib/umd/cssLanguageTypes.js'

const cssDataProvider = new CSSDataProvider(cssData) as ICSSDataProvider

export default cssDataProvider
