import { ABS, ABSOLUTE, FIXED, POSITION, REL, RELATIVE, STATIC, STICKY } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class PositionStyle extends MasterStyle {
    static override properties = [POSITION];
    static override values = {
        [ABS]: ABSOLUTE,
        [REL]: RELATIVE
    };
}

PositionStyle.semantics = {};
for (const value of [
    STATIC,
    FIXED,
    ABS,
    REL,
    STICKY
]) {
    PositionStyle.semantics[value] = value;
}
