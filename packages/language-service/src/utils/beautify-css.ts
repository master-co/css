// @ts-expect-error
import { css_beautify } from 'js-beautify/js/lib/beautify-css.js'

/** Comparisons in a query prelude; js-beautify drops the space after `>=`, `<=`, `<` and `>`. */
const queryPrelude = /^(\s*@(?:media|container|custom-media|custom-container)\b)([^{;\n]*)/gm

export default function beautifyCSS(text: string) {
  return css_beautify(text.replace(/@(media|container|supports|layer)\(/g,'@$1 ('), {
    newline_between_rules: false,
    indent_size: 2,
    space_around_combinator: true
  }).replace(queryPrelude, (_match: string, keyword: string, prelude: string) => keyword + prelude.replace(/\([^()]*\)/g, group => group.replace(/\s*(<=|>=|<|>|=)\s*/g, ' $1 ')))
}
