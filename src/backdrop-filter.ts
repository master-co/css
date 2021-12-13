import { BACKDROP, DASH, FILTER } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class BackdropFilterStyle extends MasterStyle {
    static override prefixes = /^(bd|backdrop-filter):/;
    static override properties = [BACKDROP + DASH + FILTER];
}