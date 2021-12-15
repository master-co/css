import { ISOLATE, ISOLATION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class IsolationStyle extends MasterStyle {
    static override properties = [ISOLATION];
    static override semantics = {
        [ISOLATE]: ISOLATE
    }
}