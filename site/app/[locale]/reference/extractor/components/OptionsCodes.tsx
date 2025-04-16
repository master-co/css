import dedent from 'ts-dedent'
import CodeTabs from 'internal/components/CodeTabs'

export default function ({ children, cli, webpack, vite, addLines, imports, ...othersProps }: any) {
    const dedentCode = dedent(children)
    return (
        <CodeTabs>{[
            cli && {
                ...othersProps,
                name: 'master.css-extractor.js', lang: 'js', beautify: true,
                code: dedent`
                    ${imports ? `import { ${imports} } from '@master/css-extractor'` : ''}
                    /** @type {import('@master/css-extractor').Options} */
                    export default ${dedentCode}
                `,
                addLines: addLines && addLines.map((line: number) => line += 2),
            },
            vite && {
                ...othersProps,
                name: 'vite.config.ts', lang: 'ts', beautify: true,
                code: dedent`
                    ${imports ? `import { ${imports} } from '@master/css-extractor'` : ''}
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
                    ${imports ? `const { ${imports} } = require('@master/css-extractor')` : ''}
                    const { MasterCSSExtractorPlugin } = require('@master/css.webpack')

                    module.exports = {
                        plugins: [
                            new MasterCSSExtractorPlugin(${dedentCode})
                        ]
                    }
                `,
                addLines: addLines && addLines.map((line: number) => line += 5),
            }
        ].filter(tab => tab)}</CodeTabs>
    )
}