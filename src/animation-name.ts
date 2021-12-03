import { ANIMATION, DASH, NAME } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterAnimationNameStyle extends MasterStyle {
    static override prefixes = /^(animation-name|\*name):/;
    static override properties = [ANIMATION + DASH + NAME];
}