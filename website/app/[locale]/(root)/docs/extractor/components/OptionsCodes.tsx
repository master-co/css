import dedent from 'ts-dedent'
import CodeTabs from 'websites-shared/components/CodeTabs'

export default function ({ children, cli, webpack, vite, addLines, imports, ...othersProps }: any) {
    const dedentCode = dedent(children)
    return (
        <CodeTabs>{[
            cli && {
                ...othersProps,
                name: 'master.css-extractor.js', lang: 'js',
                code: dedent`
                    ${imports ? `import { ${imports} } from '@master/css-extractor'` : ''}
                    /** @type {import('@master/css-extractor').Options} */
                    export default {
                        ${dedentCode}
                    }
                `,
                addLines: addLines && addLines.map((line: number) => line += 2),
            },
            vite && {
                ...othersProps,
                name: 'vite.config.ts', lang: 'ts',
                code: dedent`
                    ${imports ? `import { ${imports} } from '@master/css-extractor'` : ''}
                    import { CSSExtractorPlugin } from '@master/css-extractor.vite'

                    /** @type {import('vite').UserConfig} */
                    const config = {
                        plugins: [
                            CSSExtractorPlugin({
                                ${dedentCode}
                            })
                        ]
                    }

                    export default config
                `,
                addLines: addLines && addLines.map((line: number) => line += 6),
            },
            webpack && {
                ...othersProps,
                name: 'webpack.config.js', lang: 'js',
                code: dedent`
                    ${imports ? `const { ${imports} } = require('@master/css-extractor')` : ''}
                    const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')

                    module.exports = {
                        plugins: [
                            new CSSExtractorPlugin({
                                ${dedentCode}
                            })
                        ]
                    }
                `,
                addLines: addLines && addLines.map((line: number) => line += 5),
            }
        ].filter(tab => tab)}</CodeTabs>
    )
}