import { Style } from '../style';
import { StyleSheet } from '../sheet';
import { START_SYMBOL } from '../constants/start-symbol';
import { GROUP } from '../constants/css-property-keyword';

const bracketRegexp = /\{(.*)\}/;

export class Group extends Style {
    static id = GROUP;
    static override matches = /^(?:.+?[*_>~+])?\{.+?\}/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        const newProps = {};

        const addProp = (propertyName: string) => {
            const indexOfColon = propertyName.indexOf(':');
            if (indexOfColon !== -1) {
                const name = propertyName.slice(0, indexOfColon);
                if (!(name in newProps)) {
                    newProps[name] = {
                        value: propertyName.slice(indexOfColon + 1)
                    };
                }
            }
        }
        const handleStyle = (style: Style) => {
            const cssProperties = style.text.slice(CSS.escape(style.name).length).match(bracketRegexp)[1].split(';');
            for (const eachCssProperty of cssProperties) {
                addProp(eachCssProperty);
            }
        };

        const names = [];
        let currentName: string = '';
        const addName = () => {
            if (currentName) {
                names.push(currentName);
                currentName = '';
            }
        };

        let i = 1;
        const analyze = (end: string) => {
            for (; i < this.value.length; i++) {
                const char = this.value[i];

                if (!end) {
                    if (char === ';') {
                        addName();
                        continue;
                    }
                    if (char === '}') {
                        break;
                    }
                }

                currentName += char;

                if (end === char) {
                    if (end === '\'') {
                        let count = 0;
                        for (let j = currentName.length - 2;; j--)  {
                            if (currentName[j] !== '\\') {
                                break;
                            }
                            count++;
                        }
                        if (count % 2) {
                            continue;
                        }
                    }

                    break;
                } else if (char in START_SYMBOL && end !== '\'') {
                    i++;
                    analyze(START_SYMBOL[char]);
                }
            }
        };
        analyze(undefined);
        addName();
        
        for (const eachName of names) {
            const result = StyleSheet.findAndNew(eachName);
            if (Array.isArray(result)) {
                for (const eachStyle of result) {
                    handleStyle(eachStyle);
                }
            } else {
                if (result) {
                    handleStyle(result);
                } else {
                    addProp(eachName);
                }
            }
        }

        return newProps;
    }
}