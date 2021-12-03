import { OPACITY } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterOpacityStyle extends MasterStyle {
    static override prefixes = /^opacity:/;
    static override properties = [OPACITY];
}