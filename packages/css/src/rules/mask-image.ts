export const maskImage = {
    get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}