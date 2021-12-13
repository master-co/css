import { MIN_WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MinWidthStyle extends MasterStyle {
    static override prefixes =  /^min-w:/;
    static override properties = [MIN_WIDTH];
}