export const lines = {
    matches: '^lines:.',
    unit: '',
    prop: false,
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