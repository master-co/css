import { Config } from '../config'
import extractClassesFromHTML from './extract-classes-from-html'
import generateFromClasses from './generate-from-classes'

/**
 * Generates the sorted CSS text from HTML
 * @param html 
 * @param config 
 * @returns joined css text
 */
export default function generateFromHTML(html: string, config?: Config) {
    if (!html) return
    const classes = extractClassesFromHTML(html)
    if (!classes.length) return
    return generateFromClasses(classes, config)
}