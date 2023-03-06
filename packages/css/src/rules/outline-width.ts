export const outlineWidth = {
    id: 'OutlineWidth' as const,
    matches: '^outline:(?:\\.?[0-9]|medium|thick|thin|(max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}