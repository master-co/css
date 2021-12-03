import { DASH, FIRST, LETTER, TEXT, TRANSFORM, UPPERCASE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterTextLeadingStyle extends MasterStyle {
    static override prefixes = /^t:leading/;
    static override fixedPseudo = ':' + FIRST + DASH + LETTER;
    static override semantics = {
        't:leading': {
            [TEXT + DASH + TRANSFORM]: UPPERCASE
        }
    }
}