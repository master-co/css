import type { ValueComponent, VariableValueComponent } from 'shared/css-syntax'
import type { Utility } from '../utility'

export default function animationToken(this: Utility, valueComponents: ValueComponent[]) {
    if (valueComponents.length !== 1) {
        return valueComponents.map((valueComponent) => {
            if (
                valueComponent.type === 'variable'
                && valueComponent.variable?.namespace === 'animation'
                && valueComponent.token[0] !== '$'
            ) {
                return {
                    type: 'string',
                    value: valueComponent.variable.key,
                    token: valueComponent.token
                } satisfies ValueComponent
            }
            return valueComponent
        })
    }

    const [valueComponent] = valueComponents
    if (valueComponent.type !== 'string') return valueComponents

    const variableName = 'animation-' + valueComponent.value
    const variable = this.css.variables.get(variableName)
    if (!variable) return valueComponents

    return [{
        type: 'variable',
        name: variableName,
        variable,
        token: valueComponent.token
    } satisfies VariableValueComponent]
}
