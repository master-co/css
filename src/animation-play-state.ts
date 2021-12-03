import { ANIMATION, DASH, PLAY_STATE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterAnimationPlayStateVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(animation-play-state|\*play-state):/;
    static override properties = [ANIMATION + DASH + PLAY_STATE];
}