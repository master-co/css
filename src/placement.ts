import { AUTO, CENTER, MIDDLE } from './constants/css-property-keyword';
import { BOTTOM, LEFT, RIGHT, TOP } from './constants/direction';
import { Style } from '@master/style';

export class PlacementStyle extends Style {
    static override matches = /^(top|left|right|bottom|center|middle):./;
    static override semantics = {
        top: { top: 0 },
        left: { left: 0 },
        right: { right: 0 },
        bottom: { bottom: 0 },
        center: { right: 0, left: 0, 'margin-left': AUTO, 'margin-right': AUTO },
        middle: { top: 0, bottom: 0, 'margin-top': AUTO, 'margin-bottom': AUTO }
    }
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