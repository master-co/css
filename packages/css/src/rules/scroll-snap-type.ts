export const scrollSnapType = {
    id: 'ScrollSnapType' as const,
    matches: '^scroll-snap:(?:(?:[xy]|block|inline|both)(?:\\|(?:proximity|mandatory))?|$values)(?!\\|)'
}