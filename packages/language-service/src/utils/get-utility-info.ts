import { type CompiledUtility, getStaticUtilityDeclarations } from '../master-css'

export default function getUtilityInfo(utility: CompiledUtility) {
    const declarations = getStaticUtilityDeclarations(utility)
    const propsLength = Object.keys(declarations || {}).length
    const propName = Object.keys(declarations || {})[0] as keyof typeof declarations
    const propValue = declarations?.[propName]
    let detail: string | undefined
    /**
     * Remaps to native CSS properties when only one property is declared
     * */
    if (propsLength === 1) {
        detail = `${propName}: ${propValue}`
    }
    return {
        detail
    }
}
