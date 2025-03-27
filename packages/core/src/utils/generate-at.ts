import { AtComponent } from '../types/syntax'

export default function generateAt(atComponents: AtComponent[], separator = ' '): string {
    const generate = (components: AtComponent[]): string => {
        let text = components.map((component) => {
            let current = ''
            if (component.type === 'operator') {
                current = component.value
            } else if (component.type === 'group') {
                current = '(' + generate(component.children) + ')'
            } else {
                const valueUnit = String(component.value) + (component.unit || '')
                if (component.name) {
                    if (component.operator) {
                        switch (component.name) {
                            case 'min-width':
                            case 'max-width':
                            case 'width':
                                current = `(width${component.operator}${valueUnit})`
                                break
                            case 'min-height':
                            case 'max-height':
                            case 'height':
                                current = `(height${component.operator}${valueUnit})`
                                break
                            case 'device-width':
                                current = `(device-width${component.operator}${valueUnit})`
                                break
                            case 'device-height':
                                current = `(device-height${component.operator}${valueUnit})`
                                break
                            default:
                                current = '(' + `${component.name}:${valueUnit}` + ')'
                        }
                    } else {
                        current = '(' + `${component.name}:${valueUnit}` + ')'
                    }
                } else {
                    current = valueUnit
                }
            }
            return current
        }).join(separator)
        return text
    }
    const result = generate(atComponents)
    return result
}
