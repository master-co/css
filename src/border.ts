import { Style } from '@master/style';
import { BORDER } from './constants/css-property-keyword';

export class BorderStyle extends Style {
    static override prefixes = /^b:/;
    static override key = BORDER;
}