import { BREAK, DASH, SPACE, WHITE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class WhiteSpaceStyle extends Style {
    static override property = WHITE + DASH + SPACE;
    static override unit = '';
    static override semantics = {
        // break-spaces
        'break-spaces': {
            'white-space': BREAK + DASH + SPACE + 's'
        }
    }
}