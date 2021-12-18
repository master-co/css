import { Style } from '@master/style';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class BackgroundImageStyle extends Style {
    static override prefixes =  /^(bg|background)-image:/;
    static override property = BACKGROUND + DASH + IMAGE;
    static override supportFullName = false;
}