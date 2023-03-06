export const userSelect = {
    id: 'UserSelect' as const,
    get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}