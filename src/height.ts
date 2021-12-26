import { HEIGHT, SIZING_VALUES } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class HeightStyle extends Style {
    static override matches = /^h:./;
    static override key = HEIGHT;
    static override values = SIZING_VALUES;

}