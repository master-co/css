export const fontSize = {
    id: 'FontSize' as const,
    matches: '^f(?:ont)?:(?:[0-9]|(?:max|min|calc|clamp)\\(.*\\)|$values)[^|]*$'
}