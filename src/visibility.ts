import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class VisibilityStyle extends MasterStyle {
    static override properties = [VISIBILITY];
    static override semantics = {
        [VISIBLE]: VISIBLE,
        [INVISIBLE]: HIDDEN
    }
}