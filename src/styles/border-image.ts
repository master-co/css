import { Style } from '../style';
import { BORDER, dash, IMAGE } from '../constants/css-property-keyword';

export class BorderImage extends Style {
    static override key = dash(BORDER, IMAGE);
    static override unit = '';
}