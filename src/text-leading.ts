import { DASH, FIRST, LETTER, TEXT, TRANSFORM, UPPERCASE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterTextLeadingVirtualClass extends MasterVirtualClass {
    static override prefixes = /^t:leading/;
    static override fixedPseudo = ':' + FIRST + DASH + LETTER;
    static override semantics = {
        't:leading': {
            [TEXT + DASH + TRANSFORM]: UPPERCASE
        }
    }
}