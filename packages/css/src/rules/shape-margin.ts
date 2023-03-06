export const shapeMargin = {
    id: 'ShapeMargin' as const,
    matches: '^shape:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}