import { Position,Index } from './masterCssinterface'

import { StyleSheet, Style } from '@master/css';

function InCurlyBrackets(text: string): boolean {
    let curlybrackets = 0;
    for (let i = 0; i < text.length; i++) {
        if (text.charAt(i) == '{') {
            curlybrackets += 1;
        }
        else if (text.charAt(i) == '}') {
            curlybrackets -= 1;
            if (curlybrackets <= 0) {
                return false;
            }
        }
    }
    if (curlybrackets <= 0) {
        return false;
    }
    return true;
}

/**
* Check the end of the string is in "MasterCss"
*/
export function IsMasterCss(document: string) {
    let result = { isMasterCss: false, attribute: '', inCurlyBraces: false, quoted: '', text: '' };
    let CurlyBracesMode = false;
    let textSub = '', textReplaceSpace = '';

    let lastClass = document.lastIndexOf('class') ?? -1;
    let lastClassName = document.lastIndexOf('className') ?? -1;
    let CurlyBracesClassName = document.lastIndexOf('className={') ?? -1;

    if (lastClass + lastClassName + CurlyBracesClassName <= -3) {
        return result;
    }

    CurlyBracesMode = CurlyBracesClassName >= (lastClass > CurlyBracesClassName ? lastClass : lastClassName);
    result.inCurlyBraces = CurlyBracesMode;
    result.attribute = lastClass > (lastClassName > CurlyBracesClassName ? lastClassName : CurlyBracesClassName) ? 'class' : 'className';

    if (CurlyBracesMode) {
        textSub = document?.substring(CurlyBracesClassName);
        textSub == null ? '' : textSub;
        textReplaceSpace = textSub.replace(/\s/g, "")
        let clsQuoted = '';


        if (InCurlyBrackets(textSub) == false) {
            return result;
        }
        const cls = textReplaceSpace.match(/cls(['"`])/g);
        const clsx = textReplaceSpace.match(/clsx\((['"`])/g);
        const clsxClassList = textReplaceSpace.match(/clsx\('[^'.|\r|\n]*',{(['"`])/g);

        if (cls == null && clsx == null && clsxClassList == null) {
            return result;
        }
        if (cls != null) {
            clsQuoted = cls[0];
        }
        if (clsx != null) {
            clsQuoted = clsx[0];
        }
        if (clsxClassList != null) {
            clsQuoted = clsxClassList[0];
        }
        clsQuoted.charAt(clsQuoted.length - 1);
        if (textSub.split(clsQuoted).length - 1 >= 2) {
            return result;
        }
        result.quoted = clsQuoted;
        result.text = textSub;

    }
    else {
        textSub = document.substring(lastClass > lastClassName ? lastClass : lastClassName);
        textSub == null ? '' : textSub;
        textReplaceSpace = textSub.replace(/\s/g, "")
        let classQuoted = '', classEqual = '';


        if (lastClass > lastClassName) {
            classEqual = textReplaceSpace.charAt(5);
            classQuoted = textReplaceSpace.charAt(6);
        }
        else if (lastClass <= lastClassName) {
            classEqual = textReplaceSpace.charAt(9);
            classQuoted = textReplaceSpace.charAt(10);
        }

        if (classEqual + classQuoted != '=\'' && classEqual + classQuoted != '=\`' && classEqual + classQuoted != '=\"') {
            return result;
        }
        if (textSub.split(classQuoted).length - 1 >= 2) {
            return result;
        }

        result.quoted = classQuoted;
        result.text = textSub;
    }


    result.isMasterCss = true;
    return result;
}

export function IsClassList(document: string) {
    let result = { isClassList: false, method: '', quoted: '', text: '' };
    let classListMethods = [{ key: 'add', index: -1 }, { key: 'remove', index: -1 }, { key: 'replace', index: -1 }, { key: 'toggle', index: -1 }]
    classListMethods.map(x => { x.index = document.lastIndexOf(x.key) ?? -1; })

    let lastIndex = Math.max(...classListMethods.map(x => x.index));
    if (lastIndex == -1) {
        return result;
    }
    result.method = classListMethods.find(x => x.index == lastIndex)?.key ?? '';


    let textSub = document?.substring(lastIndex);
    textSub == null ? '' : textSub;
    let textReplaceSpace = textSub.replace(/\s/g, "");


    if (!(textReplaceSpace.charAt(result.method.length) == '(' && ['\`', '\"', '\''].includes(textReplaceSpace.charAt(result.method.length + 1)))) {
        return result;
    }
    else if (textSub.indexOf(')') != -1) {
        return result;
    }

    //add("foo", "bar", "baz"  textSub2=, "baz"
    let lastSeparate = textSub.lastIndexOf(',') == -1 ? textSub.lastIndexOf('(') : textSub.lastIndexOf(',');
    let textSub2 = textSub.substring(lastSeparate);
    textSub2 == null ? '' : textSub2;
    let textReplaceSpace2 = textSub2.replace(/\s/g, "");

    let quotedTemp = textReplaceSpace2.charAt(1);

    if (!['\`', '\"', '\''].includes(quotedTemp)) {
        return result;
    }
    else if (textReplaceSpace2.indexOf(quotedTemp, 2) != -1) {
        return result;
    }
    result.text=textSub2.substring(1);
    result.quoted = quotedTemp;
    result.isClassList = true;

    return result;

}

export function GetMasterInstance(text: string, lineText: string, position: Position, language: string) {
    

    let instanceRange =
    {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
    };

    //#region is in class
    let quoted:string='';
    let dataIsMasterCss = IsMasterCss(text ?? '');
    let dataIsClassList=IsClassList(text??'');

    if (!(language == 'tsx' || language == 'ts' || language == 'jsx'|| language == 'js')) {
        dataIsClassList.isClassList=false;
    }

    if (dataIsMasterCss.isMasterCss == false&&dataIsClassList.isClassList==false) {
        return { isInstance: false, instance: '', range: instanceRange };
    }
    else if(dataIsMasterCss.isMasterCss ==true){
        quoted=dataIsMasterCss.quoted;
    }
    else if(dataIsClassList.isClassList ==true)
    {
        quoted=dataIsClassList.quoted;
    }

    //#endregion is in class
    lineText = lineText.replace("[^\\S\\r\\n]+", " ");

    let instanceStart = lineText.substring(0, position.character).lastIndexOf(" ");
    let instanceEnd = lineText.indexOf(" ", position.character);
    instanceEnd = instanceEnd == -1 ? lineText.length - 1 : instanceEnd;


    instanceStart = instanceStart > lineText.substring(0, position.character).lastIndexOf(quoted) ? instanceStart : lineText.substring(0, position.character).lastIndexOf(quoted);
    instanceEnd = instanceEnd > lineText.indexOf(quoted, position.character)
        && lineText.indexOf(quoted, position.character) != -1
        ? lineText.indexOf(quoted, position.character)
        : instanceEnd;

    instanceRange = {
        start: { line: position.line, character: instanceStart + 1 },
        end: { line: position.line, character: instanceEnd },
    }


    let instance = lineText.substring(instanceStart+1,instanceEnd);
    return { isInstance: true, instance: instance, range: instanceRange };
}


export function GetAllInstance(text: string, language: string) {
    let result: {
        classList: { index: Index, instance: string }[],
        classIndex: number,
        classString: string
    }[] = [];


    let classPattern = /(?<=<\s?\w+\s+)(?:(class(?:Name)?\s?=\s?)((?:"[^"]+")|(?:'[^']+')|(?:`[^`]+`)))/g;
    let classPattern2 = /(?<=<\s?\w+\s+)(className\s?=\s?{[\w\s]+)((?:`[^`]+`)|(?:"[^"]+")|(?:'[^']+'))[^}]*}/g;
    let instancePattern = /(?:[^"'`\s])+(?:'[\$|@]'|"[\$|@]"|`[\$|@]`)?(?:[^"{'`\s])+(?=\s|\b)/g;

    let classMatch: RegExpExecArray | null;
    let classMatch2: RegExpExecArray | null;
    let instanceMatch: RegExpExecArray | null;

    while ((classMatch = classPattern.exec(text)) !== null) {
        let resultItem: {
            classList: { index: Index, instance: string }[],
            classIndex: number,
            classString: string
        } = { classList: [], classIndex: classMatch.index, classString: classMatch[0] };

        while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
            resultItem.classList.push(
                {
                    index: {
                        start: classMatch.index + classMatch[1].length + instanceMatch.index,
                        end: classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length
                    },
                    instance: instanceMatch[0]
                }
            );
        }
        result.push(resultItem);
    }


    while ((classMatch2 = classPattern2.exec(text)) !== null) {
        let resultItem: {
            classList: { index: Index, instance: string }[],
            classIndex: number,
            classString: string
        } = { classList: [], classIndex: classMatch2.index, classString: classMatch2[0] };

        while ((instanceMatch = instancePattern.exec(classMatch2[2])) !== null) {
            resultItem.classList.push(
                {
                    index: {
                        start: classMatch2.index + classMatch2[1].length + instanceMatch.index,
                        end: classMatch2.index + +classMatch2[1].length + instanceMatch.index + instanceMatch[0].length
                    },
                    instance: instanceMatch[0]
                }
            );
        }
        result.push(resultItem);
    }

    return result;
}

export function GetAllClassListInstance(text: string, language: string) {
    let result: {
        classList: { index: Index, instance: string }[],
        classIndex: number,
        classString: string
    }[] = [];


    let classPattern = /(?:((?:add)|(?:remove)|(?:replace)|(?:toggle)))\(([^\)]+)\)/g;
    //let classPattern2 = /((?:`[^`]+`)|(?:"[^"]+")|(?:'[^']+'))+/g;
    let instancePattern = /(?:[^"'`\s])+(?:'[\$|@]'|"[\$|@]"|`[\$|@]`)?(?:[^"{'`\s])+(?=\s|\b)/g;

    let classMatch: RegExpExecArray | null;
    let classMatch2: RegExpExecArray | null;
    let instanceMatch: RegExpExecArray | null;

    while ((classMatch = classPattern.exec(text)) !== null) {
        let resultItem: {
            classList: {  index: Index, instance: string }[],
            classIndex: number,
            classString: string
        } = { classList: [], classIndex: classMatch.index, classString: classMatch[0] };

        while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
            resultItem.classList.push(
                {
                    index: {
                        start: classMatch.index + classMatch[1].length + instanceMatch.index,
                        end: classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length
                    },
                    instance: instanceMatch[0]
                }
            );
        }
        result.push(resultItem);
    }

    return result;
}


export function InTags(text: string, language: string) {
    let result={
        inTag: false,
        tagAttrName:'',
        tagIndex: { start:0, end:0 },
        tagString: ''
    }

    let documentIndex = text.length ?? 0;

    let tagPattern = /<\s?\w+(?:\s+(\w+)\s?=(?:'[^']{0,}')?(?:"[^"]{0,}")?(?:`[^`]{0,}`)?(?:{[\s\S]{0,}})?)+\s?>/g;
    let tagAttrNamePattern = /(?:\s?(\w+)\s?=(?:'[^']{0,}')?(?:"[^"]{0,}")?(?:`[^`]{0,}`)?(?:{[\s\S]{0,}})?)/g;
    let tagMatch: RegExpExecArray | null;
    let tagAttrNameMatch: RegExpExecArray | null;

    while ((tagMatch = tagPattern.exec(text)) !== null) {
        if (tagMatch.index <= documentIndex && tagMatch.index + tagMatch[0].length >= documentIndex) {
            while ((tagAttrNameMatch = tagAttrNamePattern.exec(tagMatch[0])) !== null)
            {
                if (tagMatch.index+tagAttrNameMatch.index <= documentIndex && tagMatch.index+tagAttrNameMatch.index+tagAttrNameMatch[0].length >= documentIndex) {
                    result.tagAttrName=tagAttrNameMatch[1];
                }
            }
            result.inTag=true;

            result.tagIndex= {
                start: tagMatch.index,
                end: tagMatch.index + tagMatch[0].length
            };
            result.tagString= tagMatch[0]

            return result;
        }
    }

    return result;
}

