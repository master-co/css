import { Style } from '@master/style';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class BackgroundImageStyle extends Style {
    static override matches =  /^bg-image:/;
    static override key = BACKGROUND + DASH + IMAGE;
}