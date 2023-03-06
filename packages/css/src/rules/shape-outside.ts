export const shapeOutside = {
    id: 'ShapeOutside' as const,
    matches: '^shape:(?:(?:inset|circle|ellipse|polygon|url|linear-gradient)\\(.*\\)|$values)(?!\\|)'
}