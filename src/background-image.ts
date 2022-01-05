import { Style } from '@master/style';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class BackgroundImageStyle extends Style {
    static override key = BACKGROUND + DASH + IMAGE;
}