import { ALIGN, DASH, SELF } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AlignSelf extends Style {
    static override key = ALIGN + DASH + SELF;
}