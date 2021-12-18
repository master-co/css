import { ISOLATE, ISOLATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class IsolationStyle extends Style {
    static override property = ISOLATION;
    static override semantics = {
        [ISOLATE]: ISOLATE
    }
}