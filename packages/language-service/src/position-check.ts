import { instancePattern } from './utils/regex'

export function positionCheck(text: string, positionIndex: number, startIndex: number, RegExpList: string[]) {
    const result: {
        IsMatch: boolean,
        classStartIndex: number,
        classEndIndex: number,
        classString: string,
        instance: { index: { start: number, end: number }, instanceString: string },
        instanceList: { index: { start: number, end: number }, instanceString: string }[],
    } = {
        IsMatch: false,
        classStartIndex: 0,
        classEndIndex: 0,
        classString: '',
        instance: { index: { start: 0, end: 0 }, instanceString: '' },
        instanceList: [],
    }

    let instanceMatch: RegExpExecArray | null
    let classMatch: RegExpExecArray | null


    RegExpList.forEach(x => {
        const classPattern = new RegExp(x, 'g')

        while ((classMatch = classPattern.exec(text)) !== null) {
            if ((classMatch.index <= (positionIndex - startIndex) && classMatch.index + classMatch[0].length - 1 >= (positionIndex - startIndex)) == true) {
                result.IsMatch = true
                result.classStartIndex = classMatch.index
                result.classEndIndex = classMatch.index + classMatch[0].length - 1
                result.classString = classMatch[0]

                while ((instanceMatch = instancePattern.exec(classMatch[2])) !== null) {
                    result.instanceList.push(
                        {
                            index: {
                                start: classMatch.index + classMatch[1].length + instanceMatch.index,
                                end: classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length
                            },
                            instanceString: instanceMatch[0]
                        }
                    )
                    if ((classMatch.index + classMatch[1].length + instanceMatch.index <= positionIndex && classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length >= positionIndex) == true) {
                        result.instance = {
                            index: {
                                start: classMatch.index + classMatch[1].length + instanceMatch.index,
                                end: classMatch.index + classMatch[1].length + instanceMatch.index + instanceMatch[0].length
                            },
                            instanceString: instanceMatch[0]
                        }
                    }
                }

                return result
            }
            else if (classMatch.index > (positionIndex - startIndex)) {
                break
            }
        }
    })
    return result
}