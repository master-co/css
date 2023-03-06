export const lines = {
    id: 'Lines' as const,
    matches: '^lines:.',
    unit: '',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            overflow: { ...declaration, value: 'hidden' },
            display: { ...declaration, value: '-webkit-box' },
            'overflow-wrap': { ...declaration, value: 'break-word' },
            'text-overflow': { ...declaration, value: 'ellipsis' },
            '-webkit-box-orient': { ...declaration, value: 'vertical' },
            '-webkit-line-clamp': declaration
        }
    }
}