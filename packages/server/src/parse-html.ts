import { DomHandler, Parser } from 'htmlparser2'
import type { ChildNode, Element } from 'domhandler'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import decodeHTML from './decode-html'

/**
 * Containers whose content browsers parse differently from htmlparser2: foreign
 * content (`<style>` children become markup) and raw text that ends at its own
 * closing tag. CSS or JSON written into a placeholder inside them could escape.
 */
const UNSAFE_PLACEHOLDER_ANCESTORS = new Set([
  'svg', 'math', 'noscript', 'template', 'iframe', 'noembed', 'noframes', 'xmp',
  'textarea', 'title', 'plaintext', 'script', 'style', 'object'
])

/** Whether rendered text may be written into this placeholder element. */
export function isPlaceholderContext(element: Element) {
  for (let parent = element.parent; parent; parent = parent.parent) {
    if ('name' in parent && UNSAFE_PLACEHOLDER_ANCESTORS.has(parent.name.toLowerCase())) return false
  }
  return true
}

/**
 * @param html
 * @returns {classes from html, root element}
 */
export default function parseHTML(html: string): {
  classes: string[],
  nodes: ChildNode[],
  htmlElement: Element | null,
  headElement: Element | null,
  styleElement: Element | null,
  nativeStyleElements: Element[]
} {
  const classes = new Set<string>()
  let htmlElement: Element | null = null
  let headElement: Element | null = null
  let styleElement: Element | null = null
  const nativeStyleElements: Element[] = []

  const handler = new DomHandler(undefined, {}, (element) => {
    if (element.type === 'tag') {
      switch (element.name) {
        case 'html':
          htmlElement = element
          break
        case 'head':
          headElement = element
          break
        default:
          break
      }
    } else if (element.type === 'style') {
      // The first one in a safe context, which is also the one the runtime selects.
      if (element.attribs.id === MASTER_CSS_RUNTIME_STYLE_ID) {
        if (!styleElement && isPlaceholderContext(element)) styleElement = element
      }
      else if (!element.attribs.type || element.attribs.type === 'text/css') nativeStyleElements.push(element)
    }

    if (element.attribs.class) {
      decodeHTML(element.attribs.class)
        .split(/[\t\n\f\r ]+/)
        .forEach((className) => {
          if (!className) return
          classes.add(className)
        })
    }
  })

  new Parser(handler, {
    decodeEntities: false
  }).end(html)

  return {
    classes: [...classes],
    nodes: handler.root.childNodes,
    htmlElement,
    headElement,
    styleElement,
    nativeStyleElements
  }
}
