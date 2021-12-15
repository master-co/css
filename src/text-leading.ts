import { DASH, FIRST, LETTER, TEXT, TRANSFORM, UPPERCASE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TextLeadingStyle extends MasterStyle {
    static override prefixes = /^t(ext)?:leading/;
    static override fixedPseudo = ':' + FIRST + DASH + LETTER;
    static override supportFullName = false;
    override get parseValue() {
        return {
            [TEXT + DASH + TRANSFORM]: UPPERCASE
        };
    }
}