import { dash, HEIGHT, LINE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class LineHeight extends Style {
    static override matches = /^lh:./;
    static override key = dash(LINE, HEIGHT);
    static override unit = '';
}