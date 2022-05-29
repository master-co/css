import { BREAK, dash, SPACE, WHITE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class WhiteSpace extends Style {
    static override key = dash(WHITE, SPACE);
    static override unit = '';
}