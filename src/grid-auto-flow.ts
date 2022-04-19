import { AUTO, DASH, FLOW, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoFlow extends Style {
    static override matches = /^grid-flow:./;
    static override key = GRID + DASH + AUTO + DASH + FLOW;
}