import { MAX_HEIGHT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterMaxHeightStyle extends MasterStyle {
    static override prefixes = /^max-h:/;
    static override properties = [MAX_HEIGHT];
}