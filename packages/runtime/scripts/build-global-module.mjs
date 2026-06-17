import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import swc from '@swc/core'

const { transform, minify } = swc
const outputFile = resolve('dist/global.min.js')

function swcPlugin() {
    return {
        name: 'master-css-runtime-swc',
        async transform(code, id) {
            if (!/\.[cm]?[jt]sx?$/.test(id)) return null
            const result = await transform(code, {
                filename: id,
                sourceMaps: false,
                jsc: {
                    parser: {
                        syntax: id.endsWith('.ts') || id.endsWith('.tsx') ? 'typescript' : 'ecmascript',
                        jsx: id.endsWith('.tsx') || id.endsWith('.jsx'),
                        tsx: id.endsWith('.tsx')
                    },
                    target: 'es2022'
                },
                module: {
                    type: 'es6'
                }
            })
            return { code: result.code, map: null }
        }
    }
}

const bundle = await rollup({
    input: resolve('src/global.min.ts'),
    treeshake: true,
    plugins: [
        replace({
            preventAssignment: true,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        swcPlugin(),
        nodeResolve({
            browser: true,
            extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.tsx']
        }),
        commonjs()
    ]
})

try {
    const result = await bundle.generate({
        format: 'es',
        generatedCode: 'es2015'
    })
    const code = result.output
        .filter((artifact) => artifact.type === 'chunk')
        .map((chunk) => chunk.code)
        .join('\n')
    const minified = await minify(code, {
        compress: true,
        mangle: true,
        module: true,
        ecma: 2022,
        format: {
            comments: false
        }
    })
    const codeWithImportAttributes = minified.code.replace(
        /\{\s*assert\s*:\s*\{\s*type\s*:\s*(["'])json\1\s*\}\s*\}/g,
        '{with:{type:"json"}}'
    )
    await mkdir(dirname(outputFile), { recursive: true })
    await writeFile(outputFile, `${codeWithImportAttributes}\n`)
} finally {
    await bundle.close()
}
