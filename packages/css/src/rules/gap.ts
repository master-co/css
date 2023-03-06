export const gap = {
    id: 'Gap' as const,
    matches: '^gap(?:-x|-y)?:.',
    order: -1,
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        switch (this.prefix[4]) {
        case 'x':
            return { 'column-gap': declaration }
        case 'y':
            return { 'row-gap': declaration }
        default:
            return { gap: declaration }
        }
    }
}