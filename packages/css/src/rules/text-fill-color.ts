export const textFillColor = {
    id: 'TextFillColor' as const,
    matches: '^text-fill-color:.',
    colorStarts: '(?:text-fill|text|t):',
    colorful: true,
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-fill-color': declaration
        }
    }
}