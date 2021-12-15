import { ALIGN, CONTENT, DASH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AlignContentStyle extends MasterStyle {
    static override properties = [ALIGN + DASH + CONTENT];
}