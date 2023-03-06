export const backgroundImage = {
    id: 'BackgroundImage' as const,
    matches: '^(?:bg|background):(?:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\\(.*\\)|$values)(?!\\|)',
    colorful: true
}