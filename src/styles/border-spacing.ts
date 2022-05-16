import { Style } from '../style';
import { BORDER, dash, SPACING } from '../constants/css-property-keyword';

export class BorderSpacing extends Style {
    static override key = dash(BORDER, SPACING);
}