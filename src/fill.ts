import { FILL } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FillStyle extends Style {
    static override key = FILL;
    static override colorful = true;
}