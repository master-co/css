import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import { PluginContext } from '../core'
import { HTML_ENTRIES } from '../common'
import { PluginOptions } from '../options'

const HTML_OPEN_TAG_RE = /<html(\s[^>]*)?>/ig
const HIDDEN_ATTR_RE = /(?:^|\s)hidden(?:[\s=]|$)/i

const isInsideComment = (html: string, index: number) => {
  return html.lastIndexOf('<!--', index) > html.lastIndexOf('-->', index)
}

const replace = (html: string) => {
  HTML_OPEN_TAG_RE.lastIndex = 0
  for (const match of html.matchAll(HTML_OPEN_TAG_RE)) {
    if (match.index === undefined || isInsideComment(html, match.index)) continue
    const attrs = match[1] || ''
    if (HIDDEN_ATTR_RE.test(attrs)) return html
    if (process.env.DEBUG) {
      console.log(`[@master/css-vite] Avoid FOUC by adding hidden attribute to <html>`)
    }
    const start = match.index
    const end = start + match[0].length
    return html.slice(0, start) + `<html${attrs} hidden>` + html.slice(end)
  }
  return html
}

export default function AvoidFOUCPlugin(options?: PluginOptions, context?: PluginContext): Plugin {
  return {
    name: 'master-css:avoid-fouc',
    enforce: 'pre',
    transformIndexHtml(html) {
      return {
        html: replace(html),
        tags: [],
      }
    },
    transform(code, id) {
      for (const entry of HTML_ENTRIES) {
        if (id.endsWith(entry)) {
          const magicString = new MagicString(code)
          const replacedCode = replace(code)
          if (replacedCode !== code) {
            magicString.overwrite(0, code.length, replacedCode)
            return {
              code: magicString.toString(),
              map: magicString.generateMap({ hires: true }),
            }
          }
        }
      }
      return null
    }
  }
}
