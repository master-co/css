
// @ts-ignore
import { css_beautify } from 'js-beautify/js/lib/beautify-css'

export function beautifyCss(text: string) {
    return css_beautify(text, {
        newline_between_rules: true,
        end_with_newline: true
    })
}