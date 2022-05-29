import { BREAK, dash, WORD } from '../constants/css-property-keyword';
import { Style } from '../style';

export class WordBreak extends Style {
    static override key = dash(WORD, BREAK);
    static override unit = '';
}