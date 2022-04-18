import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class Visibility extends Style {
    static override key = VISIBILITY;
    static override semantics = {
        visible: VISIBLE,
        invisible: HIDDEN
    }
}