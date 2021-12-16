import { ANIMATION, DASH, PLAY_STATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationPlayStateStyle extends Style {
    static override prefixes = /^\*play-state:/;
    static override properties = [ANIMATION + DASH + PLAY_STATE];
}