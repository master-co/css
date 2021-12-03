import { BREAK, DASH, HIDDEN, OVERFLOW, WORD, WRAP } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

const BREAK_WORD = BREAK + DASH + WORD;
const OVERFLOW_WRAP = OVERFLOW + DASH + WRAP;
export class MasterWordBreakVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(wb:|word-break:)/;
    static override properties = [WORD + DASH + BREAK];
    static override defaultUnit = '';
    static override semantics = {
        // break-words
        [BREAK + DASH + WORD]: {
            [OVERFLOW_WRAP]: BREAK_WORD,
            [OVERFLOW]: HIDDEN
        }
    }
}