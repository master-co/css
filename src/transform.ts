import { DEG, PX, ROTATE, SKEW, TRANSFORM, TRANSLATE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformStyle extends Style {
    static override prefixes = /^(translate|scale|skew|rotate|perspective|matrix)(3d|X|Y|Z)?\(/;
    static override property = TRANSFORM;
    static override unit = '';
    override get parseValue() {
        return this.value.replace(
            /(translate|scale|skew|rotate|perspective|matrix)(3d|X|Y|Z)?\((.*?)\)(;|$)/gm,
            (origin, method, type, valueStr: string) => {
                let unit: string;
                switch (method) {
                    case TRANSLATE:
                        unit = PX;
                        break;
                    case SKEW:
                    case ROTATE:
                        unit = DEG;
                        break;
                    default:
                        return origin;
                }
                return origin.replace(
                    valueStr,
                    valueStr
                        .split(',')
                        .map(eachValue => eachValue + (Number.isNaN(+eachValue) ? '' : unit))
                        .join(','));
            })
    }
}