import { Style } from '../style';
import { BOX, dash, SHADOW } from '../constants/css-property-keyword';

export class BoxShadow extends Style {
    static override matches = /^s(?:hadow)?:./;
    static override key = dash(BOX, SHADOW);
    static override colorful = true;
}