import { Style } from '@master/style';
import { BORDER, DASH, SPACING } from './constants/css-property-keyword';

export class BorderSpacing extends Style {
    static override key = BORDER + DASH + SPACING;
}