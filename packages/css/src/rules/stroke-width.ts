export const strokeWidth = {
    id: 'StrokeWidth' as const,
    matches: '^stroke:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}