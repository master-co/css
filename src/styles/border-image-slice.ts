import { Style } from '@master/style';
import { BORDER, dash, IMAGE, SLICE } from '../constants/css-property-keyword';

export class BorderImageSlice extends Style {
    static override key = dash(BORDER, IMAGE, SLICE);
    static override unit = '';
}