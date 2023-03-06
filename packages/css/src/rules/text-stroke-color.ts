export const textStrokeColor = {
    id: 'TextStrokeColor' as const,
    matches: '^text-stroke-color:.',
    colorStarts: 'text-stroke:',
    colorful: true,
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-color': declaration
        }
    }
}