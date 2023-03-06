export const fontStyle = {
    id: 'FontStyle' as const,
    matches: '^f(?:ont)?:(?:normal|italic|oblique|$values)(?!\\|)',
    unit: 'deg'
}