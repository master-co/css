import Rule from '../rule'

export default class extends Rule {
    static override id: 'Placement' = 'Placement' as const
    static override matches = /^(top|left|right|bottom|center|middle):./
    static override get prop() { return '' }
    override get(declaration): { [key: string]: any } {
        const propertyName = this.prefix.slice(0, -1)
        switch (propertyName) {
        case 'top':
        case 'left':
        case 'right':
        case 'bottom':
            return { [propertyName]: declaration }
        case 'center':
            return {
                left: declaration,
                right: declaration,
                'margin-left': { ...declaration, unit: '' },
                'margin-right': { ...declaration, unit: '' }
            }
        case 'middle':
            return {
                top: declaration,
                bottom: declaration,
                'margin-top': { ...declaration, unit: '' },
                'margin-bottom': { ...declaration, unit: '' }
            }
        }
    }
}