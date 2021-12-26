import { AUTO, DASH, FLOW, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoFlowStyle extends Style {
    static override matches = /^grid(-auto)?-flow:./;
    static override key = GRID + DASH + AUTO + DASH + FLOW;
}