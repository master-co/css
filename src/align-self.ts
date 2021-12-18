import { ALIGN, DASH, SELF } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AlignSelfStyle extends Style {
    static override key = ALIGN + DASH + SELF;
}