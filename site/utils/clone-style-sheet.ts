import { StyleMatching, StyleSheet } from '@master/css';

export class CloneStyleSheet extends StyleSheet {

    static classes: Record<string, string[]> = {};
    static relations: Record<string, string[]> = {};

    static findAndNew(name: string): any {
        const findAndNewStyle = (className: string) => {
            for (const EachStyle of this.Styles) {
                const matching = EachStyle.match(className);
                if (matching) {
                    return new EachStyle(className, matching);
                }
            }
        };

        return name in this.classes
            ? (this.classes[name] as string[])
                .map(findAndNewStyle)
                .filter(eachStyle => eachStyle)
            : findAndNewStyle(name);
    }

    static find(name: string): any {
        const findStyle = (className: string) => {
            for (const EachStyle of this.Styles) {
                const matching = EachStyle.match(className);
                if (matching) {
                    return EachStyle;
                }
            }
        };

        return name in this.classes
            ? (this.classes[name] as string[])
                .map(findStyle)
                .filter(eachStyleClass => eachStyleClass)
            : findStyle(name);
    }

    static Styles = StyleSheet.Styles.map(EachStyle =>
        class CloneStyle extends EachStyle {
            constructor(
                public readonly name: string,
                public readonly matching?: StyleMatching
            ) { 
                super(name, matching);

                let prefixText = '';
                if (this.colorScheme) {
                    prefixText += '.' + this.colorScheme + ' ';
                }
                if (this.prefixSelector) {
                    prefixText += this.prefixSelector;
                }
                if (this.direction) {
                    prefixText += '[dir=' + this.direction + '] ';
                }

                // @ts-ignore
                this.text = prefixText
                    + '.'
                    + CSS.escape(this.name)
                    + this.suffixSelector
                    + '{'
                    + (typeof this.value === 'object'
                        ? Object.keys(this.value)
                            .map((propertyName) => getCssPropertyText(propertyName, {
                                ...this,
                                unit: '',
                                value: this.value[propertyName]
                            }))
                            .join(';')
                        : this.props
                            ? Object.keys(this.props)
                                .map((propertyName) => getCssPropertyText(propertyName, this.props?.[propertyName])).join(';')
                            : getCssPropertyText((this.constructor as any)['key'], this)
                    )
                    + '}';
                for (const key of Object.keys(this.at).sort((a, b) => b === 'supports' ? -1 : 1)) {
                    // @ts-ignore
                    this.text = '@' + key + ' ' + this.at[key] + '{' + this.text + '}';
                }
            }
        }
    );

    readonly styleOfName: Record<string, any> = {};

    delete(className: string) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        const sheet = this.element.sheet;
        if (sheet) {
            const deleteRule = (name: string) => {
                const style = this.styleOfName[name];
                if (
                    !style?.cssRule
                    || name in CloneStyleSheet.relations && CloneStyleSheet.relations[name].some(eachClassName => eachClassName in this.countOfName)
                )
                    return;
    
                for (let index = 0; index < sheet.cssRules.length; index++) {
                    const eachCssRule = sheet.cssRules[index];
                    if (eachCssRule === style.cssRule) {
                        sheet.deleteRule(index);
                        this.styles.splice(index, 1);
                        delete this.styleOfName[style.name];
                    }
                }
            };
    
            if (className in CloneStyleSheet.classes) {
                for (const eachClassName of CloneStyleSheet.classes[className]) {
                    if (!(eachClassName in this.countOfName)) {
                        deleteRule(eachClassName);
                    }
                }
            } else {
                deleteRule(className);
            }
        }
    }

    findAndInsert(className: string) {
        const result = CloneStyleSheet.findAndNew(className);
        if (Array.isArray(result)) {
            for (const eachStyle of result) {
                this.insert(eachStyle);
            }
        } else if (result) {
            this.insert(result);
        }
    }
}

function getCssPropertyText(name: string, property: { unit?: string, value: any, important?: boolean }) {
    return name
        + ':'
        + (property.unit
            ? property.value + property.unit
            : property.value
        )
        + (property.important ? '!important' : '')
}