export const maskImage = {
    id: 'MaskImage' as const,
    get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}