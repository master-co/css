import { MasterVirtualClass } from './virtual-class';
import { ACTION, DASH, TOUCH } from './constants/css-property-keyword';

export class MasterTouchActionVirtualClass extends MasterVirtualClass {
    static override prefixes = /^touch-action:/;
    static override properties = [TOUCH + DASH + ACTION];
}