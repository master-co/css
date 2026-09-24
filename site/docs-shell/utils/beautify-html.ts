
// @ts-ignore
import { prettyPrint } from 'html'

export function beautifyHTML(text: string) {
  return prettyPrint(text, {
    unformatted: ['code', 'pre', 'em', 'strong'],
    indent_size: 2,
    max_char: 0
  })
    .replace(/(\s[a-zA-Z-]+)=""/g, '$1')
}
