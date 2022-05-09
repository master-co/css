import { Style } from '@master/style';
import { BORDER, dash, IMAGE } from './constants/css-property-keyword';

export class BorderImageOutset extends Style {
    static override key = dash(BORDER, IMAGE, 'outset');
}