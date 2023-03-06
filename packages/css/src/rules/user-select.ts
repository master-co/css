export const userSelect = {
    get(declaration): { [key: string]: any } {
        return {
            'user-select': declaration,
            '-webkit-user-select': declaration
        }
    }
}