import { ANIMATION, DASH, PLAY_STATE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterAnimationPlayStateStyle extends MasterStyle {
    static override prefixes = /^(animation-play-state|\*play-state):/;
    static override properties = [ANIMATION + DASH + PLAY_STATE];
}