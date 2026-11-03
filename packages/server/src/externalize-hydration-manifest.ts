import { DomHandler, Parser } from 'htmlparser2'
import type { Element } from 'domhandler'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'

export interface MasterCSSExternalizedHydrationManifest {
  readonly html: string
  /** The inline manifest JSON the page carried. */
  readonly json: string
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

function elementText(element: Element) {
  return element.childNodes.map((node) => node.type === 'text' ? node.data : '').join('')
}

/**
 * Moves the inline hydration manifest of a rendered page into an external source.
 *
 * Elements are located by parsing the page, so markup that merely looks like the
 * manifest script inside text or attribute values is never edited.
 */
export function externalizeHydrationManifest(
  html: string,
  source: (json: string) => string
): MasterCSSExternalizedHydrationManifest | undefined {
  let styleElement: Element | undefined
  const scripts: Element[] = []
  const handler = new DomHandler(undefined, { withStartIndices: true, withEndIndices: true }, (element) => {
    if (element.type === 'style' && element.attribs.id === MASTER_CSS_RUNTIME_STYLE_ID) styleElement ??= element
    else if (element.type === 'script' && element.attribs.id === MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID) scripts.push(element)
  })
  new Parser(handler, { decodeEntities: false }).end(html)
  if (!styleElement || !scripts.length) return

  const json = elementText(scripts[0]).trim()
  try {
    JSON.parse(json)
  } catch {
    return
  }

  const styleStart = styleElement.startIndex
  const styleEnd = styleElement.endIndex
  if (styleStart === null || styleEnd === null) return
  // The opening tag ends right before the first child, or before `</style>` when empty.
  const openingTagEnd = styleElement.firstChild?.startIndex ?? html.lastIndexOf('<', styleEnd)
  const openingTag = html.slice(styleStart, openingTagEnd)
  const attributePattern = new RegExp(String.raw`\s${MASTER_CSS_HYDRATION_MANIFEST_ATTR}(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?`, 'i')
  const nextOpeningTag = openingTag
    .replace(attributePattern, '')
    .replace(/\s*\/?>$/, ` ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${escapeAttributeValue(source(json))}">`)

  const edits = [
    { start: styleStart, end: openingTagEnd, text: nextOpeningTag },
    ...scripts.flatMap((script) => script.startIndex === null || script.endIndex === null
      ? []
      : [{ start: script.startIndex, end: script.endIndex + 1, text: '' }])
  ].sort((a, b) => b.start - a.start)

  let nextHTML = html
  for (const edit of edits) {
    nextHTML = nextHTML.slice(0, edit.start) + edit.text + nextHTML.slice(edit.end)
  }
  return Object.freeze({ html: nextHTML, json })
}
