import { REM } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class TextSize extends MasterCSSRule {
    static id = 'textSize';
    static override matches = /^t(ext)?:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            'font-size': propertyInfo,
            'line-height': {
                ...propertyInfo,
                value: propertyInfo.unit === REM
                    ? propertyInfo.value + .375 + propertyInfo.unit
                    : 'calc(' + propertyInfo.value + propertyInfo.unit + ' + .375rem)',
                unit: ''
            }
        };
    }
}