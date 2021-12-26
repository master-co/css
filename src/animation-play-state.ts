import { ANIMATION, DASH, PLAY_STATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationPlayStateStyle extends Style {
    static override matches = /^\*play-state:/;
    static override key = ANIMATION + DASH + PLAY_STATE;
}