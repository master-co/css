import { ALIGN, dash, SELF } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class AlignSelf extends Style {
    static override matches =  /^as:./;
    static override key = dash(ALIGN, SELF);
}