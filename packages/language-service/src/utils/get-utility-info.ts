import { createCSS, DefinedRule } from '@master/css'
import cssDataProvider from './css-data-provider'
import type { IPropertyData } from 'vscode-css-languageservice'

export default function getUtilityInfo(syntax: DefinedRule, css = createCSS()) {
    const nativeProperties = cssDataProvider.provideProperties()
    const declarations = syntax.definition.declarations
    const propsLength = Object.keys(declarations || {}).length
    const propName = Object.keys(declarations || {})[0] as keyof typeof declarations
    const propValue = declarations?.[propName]
    let data: IPropertyData | undefined
    let detail: string | undefined
    /**
     * Remaps to native CSS properties when only one property is declared
     * */
    if (propsLength === 1) {
        const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === propName)
        data = nativeCSSPropertyData?.values?.find(({ name }) =>
            name === propValue
            // fix like inline-grid not found
            || name.replace(/^-(ms|moz)-/, '') === propValue
        )
        if (data) {
            detail = `${propName}: ${propValue}`
        } else {
            data = nativeCSSPropertyData
            detail = nativeCSSPropertyData?.syntax
        }
    }
    return {
        docs: '/reference/' + (data ? propName : 'utilities'),
        data,
        detail
    }
}
