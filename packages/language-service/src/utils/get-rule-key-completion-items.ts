import { CompletionItem } from 'vscode-languageserver'
import { masterCssKeyValues } from '../constant'
import cssDataProvider from './css-data-provider'
import { MasterCSS } from '@master/css'

export default function getRuleKeyCompletionItems(css: MasterCSS, triggerCharacter = ''): CompletionItem[] {
    const nativeProperties = cssDataProvider.provideProperties()
    let completionItems: CompletionItem[] = []
    masterCssKeyValues.forEach(x => {
        const fullKey = x.key[0]
        const nativeCSSPropertyData = nativeProperties.find((x: { name: string }) => x.name == fullKey)
        for (const key of x.key) {
            if (!completionItems.find(existedValue => existedValue.label === key + ':')) {
                completionItems.push({
                    label: key + ':',
                    sortText: key,
                    kind: 10,
                    documentation: nativeCSSPropertyData?.description ?? '',
                    command: {
                        title: 'triggerSuggest',
                        command: 'editor.action.triggerSuggest'
                    }
                })
            }
        }
    })
    if (css.config.semantics) {
        for (const key in css.config.semantics) {
            completionItems.push({
                label: key + ':',
                kind: 10,
                command: {
                    title: 'triggerSuggest',
                    command: 'editor.action.triggerSuggest'
                }
            })
        }
    }

    /**
     * The server capability sets '@' '~' as the trigger characters for at and adjacent selectors,
     * but these two characters are also the prefix symbols of `animation` and `transition`,
     * and should be filtered to prevent hints all completions items.
     * @example class="@"
     * @example class="~"
     */
    if (['@', '~'].includes(triggerCharacter)) {
        completionItems = completionItems
            .filter(completionItem => completionItem.label.startsWith(triggerCharacter))
            .map((completionItem) => ({ ...completionItem, insertText: completionItem.label.slice(1) }))
    }
    return completionItems
}