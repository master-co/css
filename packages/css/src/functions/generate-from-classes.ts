import { Config } from '../config'
import { MasterCSS } from '../core'

/**
 * Generates the sorted CSS text from classes
 * @param classes
 * @param config
 * @returns joined css text
 */
export default function generateFromClasses(classes: string[], config?: Config) {
    if (!classes.length) return
    const css = new MasterCSS(config)
    for (const eachClass of classes) {
        css.insert(eachClass)
    }
    return css.text
}