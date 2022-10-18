import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'TextSize'
    static override matches = /^t(ext)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/
    override get(declaration): { [key: string]: any } {
        return {
            'font-size': declaration,
            'line-height': {
                ...declaration,
                value: declaration.unit === 'rem'
                    ? declaration.value + .375 + declaration.unit
                    : 'calc(' + declaration.value + declaration.unit + ' + .375rem)',
                unit: ''
            }
        }
    }
}