const startSymbol = {
    '(': ')',
    '\'': '\''
};

module.exports = function (source, map) {
    let result = '';
    let i = /return \(/.exec(source).index + 8;

    const analyze = (end) => {
        let currentText = '';

        for (; i < source.length; i++) {
            const char = source[i];

            if (!end && char === ')') {
                break;
            }

            result += char;
            currentText += char;

            if (end === char) {
                if (end === '\'') {
                    let count = 0;
                    for (let j = currentText.length - 2;; j--)  {
                        if (currentText[j] !== '\\') {
                            break;
                        }
                        count++;
                    }
                    if (count % 2) {
                        continue;
                    }
                }

                break;
            } else if (char in startSymbol && end !== '\'') {
                i++;
                analyze(startSymbol[char]);
            }
        }
    };
    analyze();

    return result
        .replace(/className/g, 'class')
        .replace(/Image/g, 'img')
        .replace(/<>|<\/>/g, '')
        .replace(/defaultValue={'(.*)'}/g, 'value="$1"')
        .replace(/defaultChecked/g, 'checked');
}