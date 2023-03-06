export const lineClamp = {
    id: 'LineClamp' as const,
    unit: '',
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}