import { Style } from '@master/style';
import { BOX, DASH, SHADOW } from './constants/css-property-keyword';

export class BoxShadow extends Style {
    static override matches = /^shadow:./;
    static override key = BOX + DASH + SHADOW;
    static override colorful = true;
}