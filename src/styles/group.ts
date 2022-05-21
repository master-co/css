import { Style } from '../style';
import { StyleSheet } from '../sheet';
import { START_SYMBOL } from '../constants/start-symbol';

const bracketRegexp = /\{(.*)\}/;

export class Group extends Style {
    static id = 'group';
    static override matches = /^{/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        const newProps = {};

        const handleStyle = (style: Style) => {
            const cssProperties = style.text.slice(CSS.escape(style.name).length).match(bracketRegexp)[1].split(';');
            for (const eachCssProperty of cssProperties) {
                const indexOfColon = eachCssProperty.indexOf(':');
                const name = eachCssProperty.slice(0, indexOfColon);
                if (!(name in newProps)) {
                    newProps[name] = {
                        value: eachCssProperty.slice(indexOfColon + 1)
                    };
                }
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
            for (; i < this.name.length; i++) {
                const char = this.name[i];

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
            } else if (result) {
                handleStyle(result);
            }
        }

        return newProps;
    }
}