import { CENTER, MIDDLE } from '../constants/css-property-keyword';
import { BOTTOM, LEFT, RIGHT, TOP } from '../constants/direction';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Placement'
    static override matches = /^(top|left|right|bottom|center|middle):./;
    override get(declaration): { [key: string]: any } {
        const propertyName = this.prefix.slice(0, -1);
        switch (propertyName) {
            case TOP:
            case LEFT:
            case RIGHT:
            case BOTTOM:
                return { [propertyName]: declaration }
            case CENTER:
                return {
                    left: declaration,
                    right: declaration,
                    'margin-left': { ...declaration, unit: '' },
                    'margin-right': { ...declaration, unit: '' }
                }
            case MIDDLE:
                return {
                    top: declaration,
                    bottom: declaration,
                    'margin-top': { ...declaration, unit: '' },
                    'margin-bottom': { ...declaration, unit: '' }
                }
        }
    }
}