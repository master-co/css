import { sheets, Style } from './style';

const selectorSymbols = [',', '.', '#', '[', '!', '*', '>', '+', '~', ':', '@'];

const hasDocument = typeof document !== 'undefined';

let STYLE_ELEMENT: HTMLStyleElement;
if (hasDocument) {
    STYLE_ELEMENT = document.createElement('style');
    STYLE_ELEMENT.id = 'master-css'
}
const MAX_WIDTH = 'max-width';
const MIN_WIDTH = 'min-width';
const ATTRIBUTES = 'attributes';

const hasWindow = typeof window !== 'undefined';
const MutationObserver = hasWindow
    ? window.MutationObserver
    : Object;

export class StyleSheet extends MutationObserver {

    constructor(
        private container?: Element
    ) {
        super((mutationRecords) => {
            console.time('css engine');

            const correctionOfClassName = {};
            const attributeMutationRecords: MutationRecord[] = [];
            const updatedElements: Element[] = [];
            const unchangedElements: Element[] = [];

            /**
            * 取得所有深層後代的 class names 
            */
            const handleClassNameDeeply = (element: Element, remove: boolean) => {
                if (remove) {
                    element.classList.forEach(removeClassName);
                } else {
                    element.classList.forEach(addClassName);
                }

                const children = element.children;
                for (let i = 0; i < children.length; i++) {
                    const eachChildren = children[i];
                    if (eachChildren.classList) {
                        updatedElements.push(eachChildren);

                        handleClassNameDeeply(eachChildren, remove);
                    }
                }
            }

            const addClassName = (className: string) => {
                if (className in correctionOfClassName) {
                    correctionOfClassName[className]++;
                } else {
                    correctionOfClassName[className] = 1;
                }
            }

            const removeClassName = (className: string) => {
                if (className in correctionOfClassName) {
                    correctionOfClassName[className]--;
                } else if (className in this.countOfName) {
                    correctionOfClassName[className] = -1;
                }
            }

            const handleNodes = (nodes: HTMLCollection, remove: boolean) => {
                for (let i = 0; i < nodes.length; i++) {
                    const eachNode = nodes[i];
                    if (eachNode.classList && !updatedElements.includes(eachNode) && !unchangedElements.includes(eachNode)) {
                        if (eachNode.isConnected !== remove) {
                            updatedElements.push(eachNode);
                            handleClassNameDeeply(eachNode, remove);
                        } else {
                            unchangedElements.push(eachNode);
                        }
                    }
                }
            }

            for (let i = 0; i < mutationRecords.length; i++) {
                const mutationRecord = mutationRecords[i];
                const { addedNodes, removedNodes, type, target, oldValue } = mutationRecord;
                if (type === ATTRIBUTES) {
                    /**
                     * 防止同樣的 MutationRecord 重複執行
                     * According to this history, 
                     * MutationObserver was designed to work that way. 
                     * Any call to setAttribute triggers a mutation, 
                     * regardless of whether the value is being changed or set to the current value
                     */
                    if (
                        target['className'] === oldValue // prevent same class to execute
                        || attributeMutationRecords
                            .find((eachAttributeMutationRecord) => eachAttributeMutationRecord.target === target)
                    ) {
                        continue;
                    } else {
                        /**
                         * 第一個匹配到的 oldValue 一定是該批變動前的原始狀態值
                         */
                        attributeMutationRecords.push(mutationRecord);
                    }
                } else {
                    // 先判斷節點新增或移除
                    handleNodes(addedNodes, false);

                    // 忽略處理新元素的已刪除子節點
                    if (!target.isConnected || !updatedElements.includes(target)) {
                        handleNodes(removedNodes, true);
                    }
                }
            }

            if (!attributeMutationRecords.length && !Object.keys(correctionOfClassName).length) {
                console.timeEnd('css engine');
                return;
            }

            for (const { oldValue, target } of attributeMutationRecords) {
                /**
                 * 如果被操作的元素中包含了屬性變更的目標，
                 * 則將該目標從 existedAttributeMutationTargets 中移除，
                 * 以防止執行接下來的屬性變更處理
                 * 
                 * 該批 mutationRecords 中，某個 target 同時有 attribute 及 childList 的變更，
                 * 則以 childList 節點插入及移除的 target.className 為主
                 */
                const updated = updatedElements.includes(target as Element);
                const classNames = (target as Element).classList;
                const oldClassNames = oldValue ? oldValue.split(' ') : [];
                if (updated) {
                    if (target.isConnected) {
                        continue;
                    } else {
                        for (const oldClassName of oldClassNames) {
                            if (!classNames.contains(oldClassName)) {
                                removeClassName(oldClassName);
                            }
                        }
                    }
                } else {
                    if (target.isConnected) {
                        classNames.forEach((className) => {
                            if (!oldClassNames.includes(className)) {
                                addClassName(className);
                            }
                        })
                        for (const oldClassName of oldClassNames) {
                            if (!classNames.contains(oldClassName)) {
                                removeClassName(oldClassName);
                            }
                        }
                    } else {
                        for (const oldClassName of oldClassNames) {
                            removeClassName(oldClassName);
                        }
                    }
                }
            }

            for (const className in correctionOfClassName) {
                const correction = correctionOfClassName[className];
                const count = (this.countOfName[className] || 0) + correction;
                if (count === 0) {
                    // remove
                    delete this.countOfName[className];
                    /**
                     * class name 從 DOM tree 中被移除，
                     * 匹配並刪除對應的 rule
                     */
                    this.delete(className);
                } else {
                    if (!(className in this.countOfName)) {
                        // add
                        /**
                         * 新 class name 被 connected 至 DOM tree，
                         * 匹配並創建對應的 Rule
                         */
                        this.findAndInsert(className);
                    }

                    this.countOfName[className] = count;
                }
            }

            console.timeEnd('css engine');
        });

        if (!hasDocument) {
            return;
        }

        if (container) {
            const rootStyle: HTMLStyleElement = container.querySelector('[id="master-css"]');
            if (rootStyle) {
                this.element = rootStyle;
                const checkDeep = (cssRule: any, parentCssRule: any) => {
                    if (cssRule.selectorText) {
                        const selectorTexts = cssRule.selectorText.split(', ');
                        const escapedClassNames = selectorTexts[0].split(' ');

                        for (let i = 0; i < escapedClassNames.length; i++) {
                            const eachSelectorText = escapedClassNames[i];
                            if (eachSelectorText[0] === '.') {
                                const escapedClassName = eachSelectorText.slice(1);

                                let className = '';
                                for (let j = 0; j < escapedClassName.length; j++) {
                                    const char = escapedClassName[j];
                                    const nextChar = escapedClassName[j + 1];

                                    if (char === '\\') {
                                        j++;

                                        if (nextChar !== '\\') {
                                            className += nextChar;

                                            continue;
                                        }
                                    } else if (selectorSymbols.includes(char)) {
                                        break;
                                    }

                                    className += char;
                                }

                                if (!(className in this.styleOfName) && !(className in Style.classes)) {
                                    const style = StyleSheet.findAndNew(className) as Style;
                                    if (style) {
                                        style.cssRule = parentCssRule ?? cssRule;
                                        this.styles.push(style);
                                        this.styleOfName[style.name] = style;
                                    }
                                }
                            }
                        }
                    } else if (cssRule.cssRules) {
                        for (let index = 0; index < cssRule.cssRules.length; index++) {
                            checkDeep(cssRule.cssRules[index], parentCssRule ?? cssRule.cssRules[index]);
                        }
                    }
                };
                checkDeep(rootStyle.sheet, undefined);
            } else {
                this.element = STYLE_ELEMENT.cloneNode() as HTMLStyleElement;
                /** 使用 prepend 而非 append 去降低 styles 類的優先層級，無法強制排在所有 <style> 之後 */
                container?.prepend(this.element);
            }
        }

        sheets.push(this);
    }

    readonly element: HTMLStyleElement;
    readonly styles: Style[] = [];
    readonly styleOfName = {};
    readonly countOfName = {};

    static root: StyleSheet;
    static Styles: typeof Style[] = [];

    observe(target: Node, options: MutationObserverInit = { subtree: true, childList: true }) {

        const handleClassList = (classList: DOMTokenList) => {
            classList.forEach((className) => {
                if (className in this.countOfName) {
                    this.countOfName[className]++
                } else {
                    this.countOfName[className] = 1

                    this.findAndInsert(className)
                }
            })
        }
        handleClassList((target as Element).classList)

        if (options.subtree) {
            /**
             * 待所有 DOM 結構完成解析後，開始繪製 Style 樣式
             */
            (target as Element)
                .querySelectorAll('[class]')
                .forEach((element) => handleClassList(element.classList));
        }
        super.observe(target, {
            ...options,
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
        });
        return this;
    }

    disconnect(): void {
        super.disconnect();
        // @ts-ignore
        this.styleOfName = {};
        // @ts-ignore
        this.countOfName = {};

        this.styles.length = 0;

        const sheet = this.element.sheet;
        if (sheet) {
            for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
                sheet.deleteRule(i);
            }
        }
    }

    /**
     * 尋找匹配的 Style 生成實例
     */
    static findAndNew(name: string) {
        const findAndNewStyle = (className: string) => {
            for (const EachStyle of this.Styles) {
                const matching = EachStyle.match(className);
                if (matching) {
                    return new EachStyle(className, matching);
                }
            }
        };

        return name in Style.classes
            ? (Style.classes[name] as string[])
                .map(findAndNewStyle)
                .filter(eachStyle => eachStyle)
            : findAndNewStyle(name);
    }

    /**
     * 尋找匹配的 Style
     */
    static find(name: string) {
        const findStyle = (className: string) => {
            for (const EachStyle of this.Styles) {
                const matching = EachStyle.match(className);
                if (matching) {
                    return EachStyle;
                }
            }
        };

        return name in Style.classes
            ? (Style.classes[name] as string[])
                .map(findStyle)
                .filter(eachStyleClass => eachStyleClass)
            : findStyle(name);
    }

    /**
     * 全部 sheet 根據目前蒐集到的所有 DOM class 重新 findAndNew
     */
    static refresh() {
        for (const eachSheet of sheets) {
            eachSheet.refresh();
        }
    }

    /**
     * 根據目前蒐集到的所有 DOM class 重新 findAndNew
     */
    refresh() {
        if (!this.element) {
            return;
        }
        const element = STYLE_ELEMENT.cloneNode() as HTMLStyleElement;
        this.element.replaceWith(element);
        // @ts-ignore
        this.element = element;
        this.styles.length = 0;
        // @ts-ignore
        this.styleOfName = {};

        /**
         * 拿當前所有的 classNames 按照最新的 colors, breakpoints, Styles 匹配並生成新的 style
         * 所以 refresh 過後 styles 可能會變多也可能會變少
         */
        for (const name in this.countOfName) {
            this.findAndInsert(name);
        }
    }

    destroy() {
        this.disconnect();
        sheets.splice(sheets.indexOf(this), 1);
        this.element.remove();
    }

    /**
     * 1. where
     * 2. normal
     * 3. where selectors
     * 4. normal selectors
     * 5. media where
     * 6. media normal
     * 7. media selectors
     * 8. media width where
     * 9. media width
     * 10. media width selectors
     */
    insert(style: Style) {
        if (this.styleOfName[style.name]) {
            return;
        }
        const rule = style.text;
        let index;
        /**
         * 必須按斷點值遞增，並透過索引插入，
         * 以實現響應式先後套用的規則
         * @example <1  <2  <3  ALL  >=1 >=2 >=3
         * @description
         */
        const endIndex = this.styles.length - 1;
        const media = style.media;
        const order = style.order;
        const prioritySelectorIndex = style.prioritySelectorIndex;
        const hasWhere = style.hasWhere;
        const findPrioritySelectorInsertIndex = (
            styles: Style[],
            findStartIndex?: (style: Style) => any,
            findEndIndex?: (style: Style) => any,
            ignoreStyle?: (style: Style) => any
        ) => {
            let targetStyles: Style[];
            let sIndex = 0;
            let eIndex: number;

            // 1. 找尋目標陣列
            if (findStartIndex) {
                sIndex = styles.findIndex(findStartIndex);
            }
            if (findEndIndex) {
                eIndex = styles.findIndex(findEndIndex);
            }
            if (sIndex === -1) {
                sIndex = styles.length;
            }
            if (eIndex === undefined || eIndex === -1) {
                eIndex = styles.length;
            }

            targetStyles = styles.slice(sIndex, eIndex);

            // 2. 由目標陣列找尋插入點
            for (let i = 0; i < targetStyles.length; i++) {
                const currentStyle = targetStyles[i];

                if (currentStyle.prioritySelectorIndex === -1 || ignoreStyle && ignoreStyle(currentStyle))
                    continue;

                if (
                    currentStyle.prioritySelectorIndex < prioritySelectorIndex
                    || currentStyle.prioritySelectorIndex === prioritySelectorIndex
                    && (
                        hasWhere && !currentStyle.hasWhere
                        || currentStyle.order >= order
                    )
                )
                    return sIndex + i;

            }

            return sIndex + targetStyles.length;
        }

        if (media) {
            const mediaStartIndex = this.styles.findIndex(eachStyle => eachStyle.media);
            if (mediaStartIndex !== -1) {
                const maxWidthFeature = media.features[MAX_WIDTH];
                const minWidthFeature = media.features[MIN_WIDTH];
                if (maxWidthFeature && minWidthFeature) {
                    /**
                     * 範圍越小 ( 越限定 越侷限 ) 越優先，
                     * 按照範圍 max-width - min-width 遞減排序
                     * find 第一個所遇到同樣 feature 且範圍值比自己大的 rule，
                     * 並插入在該 rule 之後，讓自己優先被套用
                     */
                    const range = maxWidthFeature.value - minWidthFeature.value;
                    for (let i = endIndex; i >= mediaStartIndex; i--) {
                        index = i;

                        const eachStyle = this.styles[i];
                        const eachMedia = eachStyle.media;
                        const eachMaxWidthFeature = eachMedia.features[MAX_WIDTH];
                        const eachMinWidthFeature = eachMedia.features[MIN_WIDTH];
                        if (!eachMaxWidthFeature || !eachMinWidthFeature) {
                            index++;
                            break;
                        }

                        const eachRange = eachMaxWidthFeature.value - eachMinWidthFeature.value;
                        if (eachRange === range) {
                            if (hasWhere !== eachStyle.hasWhere)
                                continue;

                            if (prioritySelectorIndex !== -1) {
                                const sameRangeStyles = [this.styles[i]];
                                for (let j = i - 1; j >= mediaStartIndex; j--) {
                                    const currentMediaStyle = this.styles[j];
                                    if (currentMediaStyle.hasWhere !== hasWhere)
                                        break;

                                    const currentMedia = currentMediaStyle.media;
                                    const currentMaxWidthFeature = currentMedia.features[MAX_WIDTH];
                                    const currentMinWidthFeature = currentMedia.features[MIN_WIDTH];
                                    if (
                                        !currentMaxWidthFeature
                                        || !currentMinWidthFeature
                                        || (currentMaxWidthFeature.value - currentMinWidthFeature.value !== eachRange)
                                    )
                                        break;

                                    sameRangeStyles.unshift(this.styles[j]);
                                }

                                index = findPrioritySelectorInsertIndex(
                                    this.styles,
                                    eachStyle => eachStyle.media && eachStyle.prioritySelectorIndex !== -1 && eachStyle.media.features[MIN_WIDTH] && eachStyle.media.features[MAX_WIDTH]);
                            }

                            break;
                        } else if (eachRange > range) {
                            break;
                        }
                    }
                } else if (minWidthFeature) {
                    /**
                     * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                     * 並插入在該 rule 之後，讓自己優先被套用
                     */
                    for (let i = mediaStartIndex; i <= endIndex; i++) {
                        index = i;

                        const eachStyle = this.styles[i];
                        const eachMedia = eachStyle.media;
                        const eachMaxWidthFeature = eachMedia.features[MAX_WIDTH];
                        const eachMinWidthFeature = eachMedia.features[MIN_WIDTH];
                        if (eachMaxWidthFeature) {
                            /**
                             * 永遠插入在 range feature 前
                             */
                            if (eachMinWidthFeature) {
                                break;
                            } else {
                                continue;
                            }
                        }

                        const value = eachMinWidthFeature?.value;
                        if (value === minWidthFeature.value) {
                            if (!hasWhere && eachStyle.hasWhere) {
                                index++;
                                continue;
                            }

                            if (prioritySelectorIndex !== -1) {
                                index = findPrioritySelectorInsertIndex(
                                    this.styles,
                                    eachStyle => eachStyle.media,
                                    eachStyle => eachStyle.media && eachStyle.prioritySelectorIndex !== -1 && eachStyle.media.features[MIN_WIDTH] && eachStyle.media.features[MAX_WIDTH],
                                    eachStyle => !eachStyle.media.features[MIN_WIDTH] && !eachStyle.media.features[MAX_WIDTH]);
                            } else {
                                for (let j = i; j <= endIndex; j++) {
                                    const currentMediaStyle = this.styles[j];
                                    const currentMedia = currentMediaStyle.media;
                                    const currentMinWidthFeature = currentMedia.features[MIN_WIDTH];
                                    const currentMaxWidthFeature = currentMedia.features[MAX_WIDTH];

                                    if (currentMaxWidthFeature)
                                        continue;

                                    if (
                                        currentMediaStyle.hasWhere !== hasWhere
                                        || currentMinWidthFeature.value !== value
                                        || currentMediaStyle.order >= order
                                    )
                                        break;

                                    index = j + 1;
                                }
                            }

                            break;
                        } else if (value > minWidthFeature.value) {
                            break;
                        } else {
                            index++;
                        }
                    }
                } else if (maxWidthFeature) {
                    /**
                     * find 第一個所遇到同樣 feature 且值比自己大的 rule，
                     * 並插入在該 rule 之後，讓自己優先被套用
                     */
                    for (let i = endIndex; i >= mediaStartIndex; i--) {
                        index = i;

                        const eachStyle = this.styles[i];
                        const eachMedia = eachStyle.media;
                        const eachMaxWidthFeature = eachMedia.features[MAX_WIDTH];
                        const eachMinWidthFeature = eachMedia.features[MIN_WIDTH];
                        if (eachMinWidthFeature) {
                            /**
                             * 永遠插入在 range feature 前
                             */
                            continue;
                        }

                        const value = eachMaxWidthFeature?.value;
                        if (!value || value > maxWidthFeature.value) {
                            index++;
                            break;
                        } else if (value === maxWidthFeature.value) {
                            if (hasWhere && !eachStyle.hasWhere)
                                continue;

                            if (prioritySelectorIndex !== -1) {
                                index = findPrioritySelectorInsertIndex(
                                    this.styles,
                                    eachStyle => eachStyle.media,
                                    eachStyle => eachStyle.media && eachStyle.prioritySelectorIndex !== -1 && eachStyle.media.features[MIN_WIDTH] && eachStyle.media.features[MAX_WIDTH],
                                    eachStyle => !eachStyle.media.features[MIN_WIDTH] && !eachStyle.media.features[MAX_WIDTH]);
                            } else {
                                const sameRangeStyles = [this.styles[i]];
                                for (let j = i - 1; j >= mediaStartIndex; j--) {
                                    const currentMediaStyle = this.styles[j];
                                    const currentMedia = currentMediaStyle.media;
                                    const currentMinWidthFeature = currentMedia.features[MIN_WIDTH];
                                    const currentMaxWidthFeature = currentMedia.features[MAX_WIDTH];

                                    if (
                                        !currentMinWidthFeature
                                        && (!currentMaxWidthFeature
                                            || currentMaxWidthFeature.value !== value
                                            || currentMediaStyle.hasWhere !== hasWhere)
                                    )
                                        break;

                                    sameRangeStyles.unshift(currentMediaStyle);
                                }

                                for (let j = 0; j < sameRangeStyles.length; j++) {
                                    const currentMediaStyle = sameRangeStyles[j];

                                    if (currentMediaStyle.media.features[MIN_WIDTH])
                                        continue;

                                    if (currentMediaStyle.order >= order)
                                        break;

                                    index = i - sameRangeStyles.length + 2 + j;
                                }
                            }

                            break;
                        }
                    }
                }
            }
            /**
             * 如果找不到目標位置則插在最後面
             */
            if (index === undefined) {
                if (mediaStartIndex === -1) {
                    // 無任何 media 時，優先級最高
                    index = endIndex + 1;
                } else if (prioritySelectorIndex !== -1) {
                    // 含有優先 selector
                    index = mediaStartIndex +
                        findPrioritySelectorInsertIndex(
                            this.styles.slice(mediaStartIndex),
                            undefined,
                            eachStyle => eachStyle.media.features[MAX_WIDTH] || eachStyle.media.features[MIN_WIDTH]);
                } else if (hasWhere) {
                    // 不含優先 selector，且含有 where，優先級最低
                    let i = mediaStartIndex;
                    for (; i < this.styles.length; i++) {
                        const eachStyle = this.styles[i];
                        if (eachStyle.prioritySelectorIndex !== -1 || !eachStyle.hasWhere || eachStyle.order >= order) {
                            index = i;
                            break;
                        }
                    }

                    if (index === undefined) {
                        index = i;
                    }
                } else {
                    // 不含優先 selector，且不含有 where，優先級緊接非 min-width / max-width 的 where 之後
                    for (let i = mediaStartIndex; i <= endIndex; i++) {
                        index = i;

                        const eachStyle = this.styles[i];
                        const eachMedia = eachStyle.media;
                        if (eachStyle.prioritySelectorIndex !== -1 || eachMedia.features[MAX_WIDTH] || eachMedia.features[MIN_WIDTH])
                            break;

                        if (eachStyle.hasWhere) {
                            index++;
                        } else if (eachStyle.order >= order) {
                            break;
                        }
                    }
                }
            }
        } else {
            if (prioritySelectorIndex === -1) {
                // 不含優先 selector
                if (hasWhere) {
                    // 含有 where，優先級最低
                    index = this.styles.findIndex(eachStyle => !eachStyle.hasWhere
                        || eachStyle.media
                        || eachStyle.prioritySelectorIndex !== -1
                        || eachStyle.order >= order);

                    if (index === -1) {
                        index = endIndex + 1;
                    }
                } else {
                    // 不含 where，優先級緊接 where 之後
                    let i = 0;
                    for (; i < this.styles.length; i++) {
                        const eachStyle = this.styles[i];
                        if (eachStyle.media || !eachStyle.hasWhere && (eachStyle.order >= order || eachStyle.prioritySelectorIndex !== -1)) {
                            index = i;
                            break;
                        }
                    }

                    if (index === undefined) {
                        index = i;
                    }
                }
            } else {
                // 含有優先 selector
                index = findPrioritySelectorInsertIndex(this.styles, undefined, eachStyle => eachStyle.media);
            }
        }

        try {
            if (this.element) {
                const sheet = this.element.sheet;
                sheet.insertRule(rule, index);
                // @ts-ignore
                style.cssRule = sheet.cssRules[index];
            }

            this.styles.splice(index, 0, style);
            this.styleOfName[style.name] = style;
        } catch (error) {
            console.error(error);
        }
    }

    delete(className: string) {
        /**
         * class name 從 DOM tree 中被移除，
         * 匹配並刪除對應的 rule
         */
        const sheet = this.element.sheet;
        const deleteRule = (name: string) => {
            const style = this.styleOfName[name];
            if (
                !style?.cssRule
                || name in Style.relations && Style.relations[name].some(eachClassName => eachClassName in this.countOfName)
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

        if (className in Style.classes) {
            for (const eachClassName of Style.classes[className]) {
                if (!(eachClassName in this.countOfName)) {
                    deleteRule(eachClassName);
                }
            }
        } else {
            deleteRule(className);
        }
    }

    findAndInsert(className: string) {
        const result = StyleSheet.findAndNew(className);
        if (Array.isArray(result)) {
            for (const eachStyle of result) {
                this.insert(eachStyle);
            }
        } else if (result) {
            this.insert(result);
        }
    }
}

if (hasWindow) {
    window.MasterStyleSheet = StyleSheet;
}

declare global {
    interface Window {
        MasterStyleSheet: typeof StyleSheet;
    }
}