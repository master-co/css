import { type CompiledUtility, createDefaultCSS, getStaticUtilityDeclarations } from '../master-css'
import cssDataProvider from './css-data-provider'

export default function getUtilityInfo(utility: CompiledUtility, css = createDefaultCSS()) {
    const nativeProperties = cssDataProvider.provideProperties()
    const declarations = getStaticUtilityDeclarations(utility)
    const propsLength = Object.keys(declarations || {}).length
    const propName = Object.keys(declarations || {})[0] as keyof typeof declarations
    const propValue = declarations?.[propName]
    let detail: string | undefined
    /**
     * Remaps to native CSS properties when only one property is declared
     * */
    if (propsLength === 1) {
        const nativeCSSPropertyData = nativeProperties.find(({ name }) => name === propName)
        const nativeCSSValueData = nativeCSSPropertyData?.values?.find(({ name }) =>
            name === propValue
            // fix like inline-grid not found
            || name.replace(/^-(ms|moz)-/, '') === propValue
        )
        if (nativeCSSValueData) {
            detail = `${propName}: ${propValue}`
        }
    }
    return {
        detail
    }
}
