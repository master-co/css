import { Style } from '@master/style';
import { BOX, DASH, SHADOW } from './constants/css-property-keyword';

export class BoxShadowStyle extends Style {
    static override prefixes = /^shadow:/;
    static override key = BOX + DASH + SHADOW;
}