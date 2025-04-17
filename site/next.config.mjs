import redirects from './redirects.mjs'
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'
import withCommonNextConfig from 'internal/common/with-next-config.mjs'

const nextConfig = await withCommonNextConfig({
    webpack: (config, context) => {
        config.plugins.push(
            new CopyPlugin({
                patterns: [
                    { from: './node_modules/monaco-editor/min/vs', to: path.resolve('public/monaco-editor/vs') }
                ],
            })
        )
    },
    redirects
})

export default nextConfig