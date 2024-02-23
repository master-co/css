import { instancePattern } from './utils/regex'

export function positionCheck(text: string, positionIndex: number, startIndex: number, RegExpList: string[]): {
    index: { start: number, end: number }, instanceContent: string} | null {
    let result

    let instanceMatch: RegExpExecArray | null
    let classMatch: RegExpExecArray | null

    for (const classRegexString of RegExpList) {
        const classPattern = new RegExp(classRegexString, 'g')
        while ((classMatch = classPattern.exec(text)) !== null) {
            
            if ((classMatch.index <= (positionIndex - startIndex) && classMatch.index + classMatch[0].length >= (positionIndex - startIndex)) == true) {

                const classContentStartIndex = classMatch.index + classMatch[1].length
                instancePattern.lastIndex = 0
                while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
                    const instanceStartIndex = classContentStartIndex + instanceMatch.index
                    const instanceEndIndex = classContentStartIndex + instanceMatch.index + instanceMatch[0].length

                    if (instanceStartIndex <= (positionIndex - startIndex) && instanceEndIndex >= (positionIndex - startIndex)) {
                        result = {
                            index: {
                                start: instanceStartIndex,
                                end: instanceEndIndex
                            },
                            instanceContent: instanceMatch[0]
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