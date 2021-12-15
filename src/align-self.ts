import { ALIGN, DASH, SELF } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AlignSelfStyle extends MasterStyle {
    static override properties = [ALIGN + DASH + SELF];
}