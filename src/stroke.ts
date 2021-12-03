import { STROKE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterStrokeStyle extends MasterStyle {
    static override prefixes = /^stroke:/;
    static override properties = [STROKE];
}