import { STROKE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Stroke extends Style {
    static override key = STROKE;
    static override colorful = true;
}