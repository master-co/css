import { ANIMATION, dash, PLAY_STATE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class AnimationPlayState extends Style {
    static override matches = /^\@play-state:./;
    static override key = dash(ANIMATION, PLAY_STATE);
}