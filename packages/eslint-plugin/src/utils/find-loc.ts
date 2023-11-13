
export default function findLoc(text, lines, startLine, endLine) {
    const targetLines = text.match(/.+(?:\r\n|\n)?/g)

    let checkingTargetLine = 0
    let resultStart = null
    let checking = false

    for (let i = startLine; i <= endLine; i++) {
        const sourceCodeLine = lines[i - 1]

        const index = sourceCodeLine.indexOf(targetLines[checkingTargetLine].replace(/\r\n|\n/, ''))
        if (index !== -1) {
            if (checkingTargetLine === 0) {
                resultStart = {
                    line: i,
                    column: index
                }
            }
            if (checkingTargetLine === targetLines.length - 1) {
                return {
                    start: resultStart,
                    end: {
                        line: i,
                        column: index + text.length
                    }
                }
            }
            checking = true
            checkingTargetLine++
        } else {
            if (checking) {
                checking = false
                checkingTargetLine = 0
                resultStart = null
            }
        }
    }
    return null
}