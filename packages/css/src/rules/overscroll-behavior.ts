export const overscrollBehavior = {
    id: 'OverscrollBehavior' as const,
    matches: '^overscroll-behavior(?:-[xy])?:',
    get prop() { return '' },
    get(declaration): { [key: string]: any } {
        switch (this.prefix.slice(-2, -1)) {
        case 'x':
            return { 'overscroll-behavior-x': declaration }
        case 'y':
            return { 'overscroll-behavior-y': declaration }
        default:
            return { 'overscroll-behavior': declaration }
        }
    }
}