// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css'

export default function beautifyCSS(text: string) {
    return css_beautify(text, {
        newline_between_rules: false,
        indent_size: 2
    })
}