export const backgroundPosition = {
    id: 'BackgroundPosition' as const,
    matches: '^(?:bg|background):(?:top|bottom|right|left|center|$values)(?!\\|)',
    unit: 'px'
}