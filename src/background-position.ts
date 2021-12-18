import { Style } from '@master/style';
import { BACKGROUND, DASH, POSITION } from './constants/css-property-keyword';

export class BackgroundPositionStyle extends Style {
    static override prefixes =  /^(bg-position:|(bg|background):(top|bottom|right|left|center))/;
    static override key = BACKGROUND + DASH + POSITION;
}