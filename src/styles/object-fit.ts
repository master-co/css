import { dash, FIT, OBJECT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class ObjectFit extends Style {
    static override matches = /^(object|obj):(contain|cover|fill|scale-down)/;
    static override key = dash(OBJECT, FIT);
}