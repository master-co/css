
// @ts-ignore
import { html_beautify } from 'js-beautify/js/lib/beautify-html'

export function beautifyHtml(text: string) {
    return html_beautify(text, {
        "preserve_newlines": true,
    })
}