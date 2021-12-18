import { BREAK, DASH, HIDDEN, WORD } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class WordBreakStyle extends Style {
    static override key = WORD + DASH + BREAK;
    static override unit = '';
    static override semantics = {
        'break-words': {
            'overflow-wrap': BREAK + DASH + WORD,
            overflow: HIDDEN
        }
    }
}