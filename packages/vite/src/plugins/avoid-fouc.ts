import type { Plugin } from 'vite'
import { PluginContext, PluginOptions } from '../core'

export default function AvoidFOUCPlugin(options?: PluginOptions, context?: PluginContext): Plugin {
    return {
        name: 'master-css:avoid-fouc',
        enforce: 'pre',
        transformIndexHtml(html) {
            return {
                html: html.replace(
                    /<html(\s[^>]*)?>/i,
                    (match, attrs = '') => {
                        if (/hidden/.test(attrs)) return match
                        return `<html${attrs} hidden>`
                    },
                ),
                tags: [],
            }
        }
    }
}
