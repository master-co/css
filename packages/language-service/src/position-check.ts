import { instancePattern } from './utils/regex'

export function positionCheck(text: string, positionIndex: number, startIndex: number, RegExpList: string[]): {
    classStartIndex: number,
    classEndIndex: number,
    classString: string,
    instance: { index: { start: number, end: number }, instanceString: string },
} | null {
    const result = {
        classStartIndex: 0,
        classEndIndex: 0,
        classString: '',
        instance: { index: { start: 0, end: 0 }, instanceString: '' }
    }

    let instanceMatch: RegExpExecArray | null
    let classMatch: RegExpExecArray | null

    for (const classRegexString of RegExpList) {
        const classPattern = new RegExp(classRegexString, 'g')
        while ((classMatch = classPattern.exec(text)) !== null) {
            
            if ((classMatch.index <= (positionIndex - startIndex) && classMatch.index + classMatch[0].length >= (positionIndex - startIndex)) == true) {
                result.classStartIndex = classMatch.index
                result.classEndIndex = classMatch.index + classMatch[0].length
                result.classString = classMatch[0]

                const classContentStartIndex = classMatch.index + classMatch[1].length
                instancePattern.lastIndex = 0
                while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
                    const instanceStartIndex = classContentStartIndex + instanceMatch.index
                    const instanceEndIndex = classContentStartIndex + instanceMatch.index + instanceMatch[0].length

                    if (instanceStartIndex <= (positionIndex - startIndex) && instanceEndIndex >= (positionIndex - startIndex)) {
                        result.instance = {
                            index: {
                                start: instanceStartIndex,
                                end: instanceEndIndex
                            },
                            instanceString: instanceMatch[0]
                        }
                        return result
                    }
                }
            }
            else if (classMatch.index > (positionIndex - startIndex)) {
                break
            }
        }
    }
    return null
}