import { CENTER, MIDDLE } from '../constants/css-property-keyword';
import { BOTTOM, LEFT, RIGHT, TOP } from '../constants/direction';
import { MasterCSSRule } from '../rule';

// TODO: id
export class Placement extends MasterCSSRule {
    static override matches = /^(top|left|right|bottom|center|middle):./;
    override getProps(propertyInfo): { [key: string]: any } {
        const propertyName = this.prefix.slice(0, -1);
        switch (propertyName) {
            case TOP:
            case LEFT:
            case RIGHT:
            case BOTTOM:
                return { [propertyName]: propertyInfo }
            case CENTER:
                return {
                    left: propertyInfo,
                    right: propertyInfo,
                    'margin-left': { ...propertyInfo, unit: '' },
                    'margin-right': { ...propertyInfo, unit: '' }
                }
            case MIDDLE:
                return {
                    top: propertyInfo,
                    bottom: propertyInfo,
                    'margin-top': { ...propertyInfo, unit: '' },
                    'margin-bottom': { ...propertyInfo, unit: '' }
                }
        }
    }
}