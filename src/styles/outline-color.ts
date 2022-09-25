import { COLOR, dash, OUTLINE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class OutlineColor extends Style {
    static override key = dash(OUTLINE, COLOR);
    static override colorStarts = 'outline:';
    static override colorful = true;
}