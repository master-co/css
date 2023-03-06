export const boxDecorationBreak = {
    id: 'BoxDecorationBreak' as const,
    matches: '^box:(?:slice|clone|$values)(?!\\|)',
    get(declaration): { [key: string]: any } {
        return {
            'box-decoration-break': declaration,
            '-webkit-box-decoration-break': declaration
        }
    }
}