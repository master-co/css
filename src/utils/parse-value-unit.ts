export function parseValueUnit(value: string, getUnit: (method: string) => string): string {
    let result = '';

    let i = 0;
    (function analyze(end?, method?) {
        let current = '';
        const unit = method
            ? getUnit(method)
            : '';

        const pushCurrent = () => {
            if (current) {
                result += (!unit || Number.isNaN(+current))
                    ? current
                    : (+current / (unit === 'rem' ? this.css.config.rootSize : 1)) + unit;

                current = '';
            }
        };

        for (; i < value.length; i++) {
            const val = value[i];

            if (val === end && (end !== '\'' || value[i + 1] === ')')) {
                pushCurrent();
                result += val;
                break;
            } else if (val === ',' || val === ' ') {
                pushCurrent();
                result += val;
            } else if (!current && val === '\'') {
                result += val;

                i++;
                analyze(val);
                current = '';
            } else if (current && val === '(') {
                result += current + val;

                i++;
                analyze(')', current);
                current = '';
            } else {
                current += val;
            }
        }

        pushCurrent();
    })();

    return result;
}