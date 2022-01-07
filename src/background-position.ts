import { Style } from '@master/style';
import { BACKGROUND, DASH, POSITION, PX } from './constants/css-property-keyword';

export class BackgroundPositionStyle extends Style {
    static override matches = /^(bg|background):((top|bottom|right|left|center)(?!;)|-?\.?\d((?!;).)*$)/;
    static override key = BACKGROUND + DASH + POSITION;
    static override unit = PX;
}