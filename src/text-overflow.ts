import { CLIP, DASH, ELLIPSIS, OVERFLOW, TEXT, T_PREFIX } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTextOverflowVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(t-overflow:|t:(ellipsis|clip))/;
    static override properties = [TEXT + DASH + OVERFLOW];
}