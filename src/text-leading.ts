import { DASH, FIRST, LETTER, UPPERCASE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextLeadingStyle extends Style {
    static override prefixes = /^t(ext)?:leading/;
    static override fixedPseudo = '::' + FIRST + DASH + LETTER;
    override get parseValue() {
        return {
            'text-transform': UPPERCASE
        };
    }
}