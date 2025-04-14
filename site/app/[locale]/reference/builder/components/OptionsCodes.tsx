import dedent from 'ts-dedent'
import CodeTabs from 'internal/components/CodeTabs'

export default function ({ children, cli, webpack, vite, addLines, imports, ...othersProps }: any) {
    const dedentCode = dedent(children)
    return (
        <CodeTabs>{[
            cli && {
                ...othersProps,
                name: 'master.css-builder.js', lang: 'js', beautify: true,
                code: dedent`
                    ${imports ? `import { ${imports} } from '@master/css-builder'` : ''}
                    /** @type {import('@master/css-builder').Options} */
                    export default ${dedentCode}
                `,
                addLines: addLines && addLines.map((line: number) => line += 2),
            },
            vite && {
                ...othersProps,
                name: 'vite.config.ts', lang: 'ts', beautify: true,
                code: dedent`
                    ${imports ? `import { ${imports} } from '@master/css-builder'` : ''}
                    import masterCSS from '@master/css.vite'

                    /** @type {import('vite').UserConfig} */
                    const config = {
                        plugins: [
                            masterCSS(${dedentCode})
                        ]
                    }

                    export default config
                `,
                addLines: addLines && addLines.map((line: number) => line += 6),
            },
            webpack && {
                ...othersProps,
                name: 'webpack.config.js', lang: 'js', beautify: true,
                code: dedent`
                    ${imports ? `const { ${imports} } = require('@master/css-builder')` : ''}
                    const MasterCSSPlugin = require('@master/css.webpack')

                    module.exports = {
                        plugins: [
                            new MasterCSSPlugin(${dedentCode})
                        ]
                    }
                `,
                addLines: addLines && addLines.map((line: number) => line += 5),
            }
        ].filter(tab => tab)}</CodeTabs>
    )
}