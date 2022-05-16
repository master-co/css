import { BREAK, dash, SPACE, WHITE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class WhiteSpace extends Style {
    static override key = dash(WHITE, SPACE);
    static override unit = '';
    static override semantics = {
        // break-spaces
        'break-spaces': {
            'white-space': dash(BREAK, SPACE) + 's'
        }
    }
}