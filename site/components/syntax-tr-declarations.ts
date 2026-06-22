import css from '../common/preset-css'

export function generateSyntaxTrDeclarations(proxyCode: string, previewSyntax?: string) {
    const rule = css.generate(proxyCode)[0] ?? (previewSyntax ? css.generate(previewSyntax)[0] : undefined)
    const declarations = rule?.declarations as Record<string, any> | undefined

    if (!declarations || !Object.keys(declarations).length) {
        throw new Error(`SyntaxTr generated empty CSS declarations for \`${proxyCode}\`.`)
    }

    return declarations
}
