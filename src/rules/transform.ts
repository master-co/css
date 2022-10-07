import { DEG, REM, ROTATE, SKEW, TRANSFORM, TRANSLATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Transform extends MasterCSSRule {
    static override matches = /^(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\(/;
    static override key = TRANSFORM;
    static override unit = '';
    override parseValue(value: string): string {
        return value.replace(
            /(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g,
            (origin, method, type, valueStr: string) => {
                let unit: string;
                let last: boolean;
                switch (method) {
                    case TRANSLATE:
                        unit = REM;
                        break;
                    case SKEW:
                        unit = DEG;
                        break;
                    case ROTATE:
                        if (type === '3d') {
                            last = true;
                        }
                        unit = DEG;
                        break;
                    default:
                        return origin;
                }

                const values = valueStr.split(',')
                return origin.replace(
                    valueStr,
                    values
                        .map((eachValue, i) => {
                            if (!last || values.length - 1 === i) {
                                const isNaN = Number.isNaN(+eachValue);
                                return isNaN
                                    ? eachValue
                                    : ((eachValue as any) / (unit === REM ? 16 : 1)) // 將無單位的 / 16 轉為 rem
                                    + unit;
                            } else {
                                return eachValue;
                            }
                        })
                        .join(','));
            })
    }
}