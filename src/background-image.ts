import { Style } from '@master/style';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class BackgroundImageStyle extends Style {
    static override prefixes =  /^bg-image:/;
    static override properties = [BACKGROUND + DASH + IMAGE];
}