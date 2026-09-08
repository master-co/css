import { Parser } from 'htmlparser2'

/** Decode as an HTML attribute while preserving the document's original markup. */
export default function decodeHTML(html: string) {
  if (!html.includes('&')) return html
  let decoded = html
  new Parser({
    onattribute(name, value) {
      if (name === 'class') decoded = value
    }
  }, { decodeEntities: true }).end(`<span class="${html.replaceAll('"', '&quot;')}">`)
  return decoded
}
