import { HEIGHT, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class HeightStyle extends Style {
    static override prefixes = /^h:/;
    static override property = HEIGHT;
    static override values = SIZING_VALUES;

}