
// @ts-ignore
import { css_beautify } from 'js-beautify/js/lib/beautify-css'

export function beautifyCSS(text: string) {
  return css_beautify(text.replace(/@(media|container|supports|layer)\(/g,'@$1 ('), {
    newline_between_rules: true,
    indent_size: 2,
    end_with_newline: true
  })
}
