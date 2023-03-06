export const backgroundClip = {
    id: 'BackgroundClip' as const,
    matches: '^(?:bg|background):(?:text|$values)(?!\\|)',
    get(declaration): { [key: string]: any } {
        return {
            '-webkit-background-clip': declaration,
            'background-clip': declaration
        }
    }
}