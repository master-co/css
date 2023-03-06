export const textStroke = {
    id: 'TextStroke' as const,
    matches: '^text-stroke:.',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke': declaration
        }
    }
}