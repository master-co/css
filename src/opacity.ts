import { OPACITY } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterOpacityVirtualClass extends MasterVirtualClass {
    static override prefixes = /^opacity:/;
    static override properties = [OPACITY];
}