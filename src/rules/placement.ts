import { CENTER, MIDDLE } from '../constants/css-property-keyword';
import { BOTTOM, LEFT, RIGHT, TOP } from '../constants/direction';
import { MasterCSSRule } from '../rule';

// TODO: id
export class Placement extends MasterCSSRule {
    static override matches = /^(top|left|right|bottom|center|middle):./;
    override get props(): { [key: string]: any } {
        const propertyName = this.prefix.slice(0, -1);
        switch (propertyName) {
            case TOP:
            case LEFT:
            case RIGHT:
            case BOTTOM:
                return { [propertyName]: this }
            case CENTER:
                return {
                    left: this,
                    right: this,
                    'margin-left': { ...this, unit: '' },
                    'margin-right': { ...this, unit: '' }
                }
            case MIDDLE:
                return {
                    top: this,
                    bottom: this,
                    'margin-top': { ...this, unit: '' },
                    'margin-bottom': { ...this, unit: '' }
                }
        }
    }
}