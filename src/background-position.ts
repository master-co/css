import { Style } from '@master/style';
import { BACKGROUND, DASH, POSITION } from './constants/css-property-keyword';

export class BackgroundPositionStyle extends Style {
    static override prefixes =  /^((bg|background)-position:|(bg|background):(top|bottom|right|left|center))/;
    static override property = BACKGROUND + DASH + POSITION;
    static override supportFullName = false;
}