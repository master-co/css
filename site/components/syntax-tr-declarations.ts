import css from '../common/preset-css'

export function generateSyntaxTrDeclarations(proxyCode: string, previewSyntax?: string) {
    const rule = css.generate(proxyCode)[0] ?? (previewSyntax ? css.generate(previewSyntax)[0] : undefined)
    return rule?.declarations as Record<string, any> | undefined
}
