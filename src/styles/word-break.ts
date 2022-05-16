import { BREAK, dash, HIDDEN, WORD } from '../constants/css-property-keyword';
import { Style } from '../style';

export class WordBreak extends Style {
    static override key = dash(WORD, BREAK);
    static override unit = '';
    static override semantics = {
        'break-word': {
            'overflow-wrap': dash(BREAK, WORD),
            overflow: HIDDEN
        }
    }
}