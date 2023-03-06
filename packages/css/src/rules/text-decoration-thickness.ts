export const textDecorationThickness = {
    id: 'TextDecorationThickness' as const,
    matches: '^text-decoration:(?:\\.?[0-9]|(?:max|min|calc|clamp)\\(.*\\)|from-font|$values)[^|]*$',
    unit: 'em'
}