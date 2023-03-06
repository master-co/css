export const textStrokeWidth = {
    id: 'TextStrokeWidth' as const,
    matches: '^text-stroke(:(thin|medium|thick|\\.?[0-9]+|$values)(?!\\|)|-width:.)',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-text-stroke-width': declaration
        }
    }
}