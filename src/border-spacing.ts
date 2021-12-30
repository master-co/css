import { Style } from '@master/style';
import { BORDER, DASH, SPACING } from './constants/css-property-keyword';

export class BorderSpacingStyle extends Style {
    static override matches = /^b-spacing:./;
    static override key = BORDER + DASH + SPACING;
}