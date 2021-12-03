import { LETTER_SPACING } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterLetterSpacingVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(ls|letter-spacing):/;
    static override properties = [LETTER_SPACING];
    static override defaultUnit = 'em';
}