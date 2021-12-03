import { BREAK, DASH, OVERFLOW, SPACING, WORD, WRAP } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

const BREAK_WORD = BREAK + DASH + WORD;
const OVERFLOW_WRAP = OVERFLOW + DASH + WRAP;
export class MasterWordSpacingVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(ws:|word-spacing:)/;
    static override properties = [WORD + DASH + SPACING];
}