import { MasterCSSConfig } from 'src/interfaces/config';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'Transform'
    static override matches = /^(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\(/;
    static override propName = 'transform';
    static override unit = '';
    override parseValue(value: string, {rootSize}: MasterCSSConfig): string {
        return value.replace(
            /(translate|scale|skew|rotate|perspective|matrix)(3d|[XYZ])?\((.*?)\)/g,
            (origin, method, type, valueStr: string) => {
                let unit: string;
                let last: boolean;
                switch (method) {
                    case 'translate':
                        unit = 'rem';
                        break;
                    case 'skew':
                        unit = 'deg';
                        break;
                    case 'rotate':
                        if (type === '3d') {
                            last = true;
                        }
                        unit = 'deg';
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
                                    : ((eachValue as any) / (unit === 'rem' ? rootSize : 1))
                                    + unit;
                            } else {
                                return eachValue;
                            }
                        })
                        .join(','));
            })
    }
}