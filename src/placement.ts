import { CENTER, MIDDLE } from './constants/css-property-keyword';
import { BOTTOM, LEFT, RIGHT, TOP } from './constants/direction';
import { Style } from '@master/style';

export class PlacementStyle extends Style {
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