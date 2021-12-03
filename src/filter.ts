import { FILTER } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterFilterStyle extends MasterStyle {
    static override prefixes = /^filter:/;
    static override properties = [FILTER];
}