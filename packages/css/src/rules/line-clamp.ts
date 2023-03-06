export const lineClamp = {
    unit: '',
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-line-clamp': declaration
        }
    }
}