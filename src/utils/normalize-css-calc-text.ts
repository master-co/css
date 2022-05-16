/**
 * 將 calc( 正規化
 * https://aoyue.notion.site/css-calc-2f37632c5cf749949cc060f0f2111443
 */
export function normalizeCssCalcText(value: string) {
    const isOperator = (char: string) => char === '+' || char === '-' || char === '*' || char === '/';

    let newValue = '', type: 1 | 2, current = '', endWithBracket = false;
    function clear() {
        type = null;
        current = '';
    }

    for (let i = 0; i < value.length; i++) {
        const char = value[i];

        if (char === '(' || char === ')') {
            endWithBracket = char === ')';
            newValue += current + char;
            clear();
        } else if (char === ',') {
            newValue += current + char + ' ';
            clear();
        } else {
            switch (type) {
                // 字串
                case 1:
                    break;
                // 數字
                case 2:
                    if (isOperator(char)) {
                        newValue += current + ' ' + char + ' ';
                        clear();
                        continue;
                    }
                    break;
                default:
                    if (endWithBracket) {
                        current += ' ';
                    }

                    if (!isNaN(+char)) {
                        type = 2;
                    } else if (!isOperator(char)) {
                        type = 1;
                    }
                    break;
            }

            current += char;
        }
    }

    if (current) {
        newValue += current;
    }

    return newValue;
}