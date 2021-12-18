import { ISOLATE, ISOLATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class IsolationStyle extends Style {
    static override key = ISOLATION;
    static override semantics = {
        isolate: ISOLATE
    }
}