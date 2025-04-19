import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import { PluginContext } from '../core'
import { HTML_ENTRIES } from '../common'
import { PluginOptions } from '../options'

const replace = (html: string) => {
    return html.replace(
        /<html(\s[^>]*)?>/i,
        (match, attrs = '') => {
            if (/hidden/.test(attrs)) return match
            if (process.env.DEBUG) {
                console.log(`[@master/css.vite] Avoid FOUC by adding hidden attribute to <html>`)
            }
            return `<html${attrs} hidden>`
        },
    )
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
