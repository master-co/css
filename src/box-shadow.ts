import { Style } from '@master/style';
import { BOX, dash, SHADOW } from './constants/css-property-keyword';

export class BoxShadow extends Style {
    static override matches = /^shadow:./;
    static override key = dash(BOX, SHADOW);
    static override colorful = true;
}