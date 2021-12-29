import { DASH, FIT, OBJECT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ObjectFitStyle extends Style {
    static override matches =  /^object:(contain|cover|fill|scale-down)(?!;)/;
    static override key = OBJECT + DASH + FIT;
}