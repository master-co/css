export const userDrag = {
    id: 'UserDrag' as const,
    get(declaration): { [key: string]: any } {
        return {
            'user-drag': declaration,
            '-webkit-user-drag': declaration
        }
    }
}