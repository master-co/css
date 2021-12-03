import { DASH, TEXT, TRANSFORM } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTextTransformVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(t-transform:|t:(uppercase|lowercase|capitalize))/;
    static override properties = [TEXT + DASH + TRANSFORM];
}