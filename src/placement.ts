import { AUTO, CENTER, DASH, MARGIN, MIDDLE } from './constants/css-property-keyword';
import { BOTTOM, LEFT, RIGHT, TOP } from './constants/direction';
import { MasterVirtualClass } from './virtual-class';

const MARGIN_LEFT = MARGIN + DASH + LEFT;
const MARGIN_RIGHT = MARGIN + DASH + RIGHT;
const MARGIN_BOTTOM = MARGIN + DASH + BOTTOM;
const MARGIN_TOP = MARGIN + DASH + TOP;

export class MasterPlacementVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(top|left|right|bottom|center|middle):/;
    static override semantics = {
        [TOP]: { [TOP]: 0 },
        [LEFT]: { [LEFT]: 0 },
        [RIGHT]: { [RIGHT]: 0 },
        [BOTTOM]: { [BOTTOM]: 0 },
        [CENTER]: { [RIGHT]: 0, [LEFT]: 0, [MARGIN_LEFT]: AUTO, [MARGIN_RIGHT]: AUTO },
        [MIDDLE]: { [TOP]: 0, [BOTTOM]: 0, [MARGIN_TOP]: AUTO, [MARGIN_BOTTOM]: AUTO }
    }
    override get properties(): { [key: string]: any } {
        const propertyName = this.prefix.slice(0, -1);
        switch (propertyName) {
            case TOP:
            case LEFT:
            case RIGHT:
            case BOTTOM:
                return { [propertyName]: this }
            case CENTER:
                return {
                    [LEFT]: this,
                    [RIGHT]: this,
                    [MARGIN_LEFT]: { ...this, unit: '', value: AUTO },
                    [MARGIN_RIGHT]: { ...this, unit: '', value: AUTO }
                }
            case MIDDLE:
                return {
                    [TOP]: this,
                    [BOTTOM]: this,
                    [MARGIN_TOP]: { ...this, unit: '', value: AUTO },
                    [MARGIN_BOTTOM]: { ...this, unit: '', value: AUTO }
                }
        }
    }
}