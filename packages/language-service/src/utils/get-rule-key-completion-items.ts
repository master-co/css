import { CompletionItem } from 'vscode-languageserver'
import { masterCssKeyValues } from '../constant'
import cssDataProvider from './css-data-provider'
import { MasterCSS } from '@master/css'

export default function getRuleKeyCompletionItems(triggerCharacter = '', css: MasterCSS): CompletionItem[] {
    const completionItems: CompletionItem[] = []
    masterCssKeyValues.forEach(x => {
        const fullKey = x.key[0]
        const originalCssProperty = cssDataProvider.provideProperties().find((x: { name: string }) => x.name == fullKey)
        const originalCssValues = originalCssProperty?.values ?? []
        for (const key of x.key) {
            if (!completionItems.find(existedValue => existedValue.label === key + ':')) {
                completionItems.push({
                    label: key + ':',
                    insertText: key.replace(new RegExp(`^${triggerCharacter}`), '') + ':',
                    kind: 10,
                    documentation: originalCssProperty?.description ?? '',
                    command: {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                })
            }
        }
    })

    // if ((!masterCssKeys.includes(key))) {
    //     completionItems = completionItems.concat(completionItems)
    //     completionItems = completionItems.concat(getReturnItem(Object.keys(css.config?.semantics ?? {}), 10))

    //     // if (language == 'tsx' || language == 'vue' || language == 'jsx') {
    //     //     return haveDash(key, completionItems)
    //     // }
    //     return completionItems
    // }

    return completionItems
}