import {
    TextDocuments,
    TextDocumentPositionParams,
    Hover
} from 'vscode-languageserver/node';
import { Range, TextDocument } from 'vscode-languageserver-textdocument';
import MasterCSS, { render } from '@master/css'
import { css_beautify } from 'js-beautify';


export function GetHoverInstance(textDocumentPosition: TextDocumentPositionParams, documents: TextDocuments<TextDocument>) {
    const documentUri = textDocumentPosition.textDocument.uri;
    let language = documentUri.substring(documentUri.lastIndexOf('.') + 1);
    const position = textDocumentPosition.position;

    let classPattern = /(?:[^"{'\s])+(?=>\s|\b)/g;
    let classMatch: RegExpExecArray | null;

    let document = documents.get(documentUri);

    let instanceRange =
    {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
    };

    let line = document?.getText({
        start: { line: position.line, character: 0 },
        end: { line: position.line + 1, character: 0 },
    })

    let lineText: string = line == null ? '' : line;

    let text = document?.getText({
        start: { line: 0, character: 0 },
        end: { line: position.line, character: position.character },
    });

    //#region is in class
    let lastClass = text?.lastIndexOf('class') ?? -1;
    let lastclassName = text?.lastIndexOf('className') ?? -1;
    let tsxclassName = text?.lastIndexOf('className={') ?? -1;

    if (lastClass + lastclassName + tsxclassName == -1) {
        return { isInstance: false, instance: '', range: instanceRange, language: language };
    }

    let tsxclassNameMode = tsxclassName >= (lastClass > lastclassName ? lastClass : lastclassName);
    let textSub = text?.substring(lastClass > lastclassName ? lastClass : lastclassName);
    textSub = textSub == null ? '' : textSub;


    let classQuoted = '', classIndexAddOne = '', classIndexAddTwo = '';


    if (tsxclassNameMode) {
        textSub = text?.substring(tsxclassName) == null ? '' : textSub;
        if (InCurlyBrackets(textSub) == false) {
            return { isInstance: false, instance: '', range: instanceRange, language: language };
        }
    }
    else {
        if (lastClass > lastclassName) {
            classIndexAddOne = textSub.substring(5).trimStart().charAt(0);
            classIndexAddTwo = textSub.substring(5).trimStart().substring(1).trimStart().charAt(0);
        }
        else if (lastClass <= lastclassName) {
            classIndexAddOne = textSub.substring(9).trimStart().charAt(0);
            classIndexAddTwo = textSub.substring(9).trimStart().substring(1).trimStart().charAt(0);
        }
        classQuoted = classIndexAddOne + classIndexAddTwo;
        if (classQuoted != '=\'' && classQuoted != '=\`' && classQuoted != '=\"') {
            return { isInstance: false, instance: '', range: instanceRange, language: language };
        }
    }

    let quotedSingle = textSub.split('\'').length - 1;
    let quotedDouble = textSub.split('\"').length - 1;
    let quotedTemplate = textSub.split('\`').length - 1;
    if (!tsxclassNameMode) {
        if (classQuoted == '=\'' && quotedSingle >= 2) {
            return { isInstance: false, instance: '', range: instanceRange, language: language };
        }
        else if (classQuoted == '=\"' && quotedDouble >= 2) {
            return { isInstance: false, instance: '', range: instanceRange, language: language };
        }
        else if (classQuoted == '=\`' && quotedTemplate >= 2) {
            return { isInstance: false, instance: '', range: instanceRange, language: language };
        }
    }

    if (!((quotedSingle > 0 || quotedDouble > 0 || quotedTemplate > 0) && (quotedSingle % 2 != 0 || quotedDouble % 2 != 0 || quotedTemplate % 2 != 0))) {
        return { isInstance: false, instance: '', range: instanceRange, language: language };
    }
    //#endregion is in class
    lineText = lineText.replace("[^\\S\\r\\n]+", " ");

    let instanceStart = lineText.substring(0, position.character).lastIndexOf(" ");
    let instanceEnd = lineText.indexOf(" ", position.character);
    instanceEnd = instanceEnd == -1 ? lineText.length - 1 : instanceEnd;

    if (tsxclassNameMode) {
        instanceStart = instanceStart > lineText.substring(0, position.character).lastIndexOf("{") ? instanceStart : lineText.substring(0, position.character).lastIndexOf("{");
        instanceEnd = instanceEnd < lineText.indexOf("}", position.character) ? instanceEnd : (lineText.indexOf("}", position.character)==-1?instanceEnd:lineText.indexOf("}", position.character));
    }
    else {
        instanceStart = instanceStart > lineText.substring(0, position.character).lastIndexOf(classIndexAddTwo) ? instanceStart : lineText.substring(0, position.character).lastIndexOf(classIndexAddTwo);
        instanceEnd = instanceEnd > lineText.indexOf(classIndexAddTwo, position.character)
            && lineText.indexOf(classIndexAddTwo, position.character) != -1
            ? lineText.indexOf(classIndexAddTwo, position.character)
            : instanceEnd;
    }


    instanceRange = {
        start: { line: position.line, character: instanceStart + 1 },
        end: { line: position.line, character: instanceEnd },
    }
    let instance = document?.getText(instanceRange) ?? '';

    return { isInstance: true, instance: instance, range: instanceRange, language: language };
}
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

export function doHover(instance: string, range: Range, masterCss: MasterCSS = new MasterCSS()): Hover | null {
    let renderText = render(instance.split(' '), masterCss);
    if (!renderText || renderText == ' ') {
        return null;
    }

    return {
        contents: {
            language: 'css',
            value: css_beautify(renderText, {
                newline_between_rules: true,
                end_with_newline: true
            })
        },
        range: range
    };
}