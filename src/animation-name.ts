import { ANIMATION, DASH, NAME } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationNameStyle extends MasterStyle {
    static override prefixes = /^\*name:/;
    static override properties = [ANIMATION + DASH + NAME];
}