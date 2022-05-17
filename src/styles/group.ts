import { Style } from '../style';
import { StyleSheet } from '../sheet';

const bracketRegexp = /\{(.*?)\}/;

export class Group extends Style {
    static id = 'group';
    static override matches = /^{/;
    static override unit = '';
    override get props(): { [key: string]: any } {
        const newProps = {};

        const handleStyle = (style: Style) => {
            const cssProperties = style.text.match(bracketRegexp)[1].split(';');
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
        
        const names = this.name.match(bracketRegexp)[1].split('|');
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