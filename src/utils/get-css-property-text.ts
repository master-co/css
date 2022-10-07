export function getCssPropertyText(name: string, property: { unit?: string, value: any, important?: boolean }) {
    return (name ? name + ':' : '')
        + (property.unit
            ? property.value + property.unit
            : property.value)
        + (property.important ? '!important' : '')
}