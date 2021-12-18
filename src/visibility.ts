import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class VisibilityStyle extends Style {
    static override property = VISIBILITY;
    static override semantics = {
        [VISIBLE]: VISIBLE,
        [INVISIBLE]: HIDDEN
    }
}