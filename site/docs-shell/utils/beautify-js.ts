// @ts-ignore
import { js_beautify } from 'js-beautify/js/lib/beautify'

export default function beautifyJS(text: string) {
  return js_beautify(text, {
    indent_size: 2,
    end_with_newline: true
  })
}
