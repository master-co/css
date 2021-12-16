import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class VisibilityStyle extends Style {
    static override properties = [VISIBILITY];
    static override semantics = {
        [VISIBLE]: VISIBLE,
        [INVISIBLE]: HIDDEN
    }
}