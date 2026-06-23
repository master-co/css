import stripAnsi from 'strip-ansi'
import { Subprocess } from 'execa'

export default function waitForDataMatch(child: Subprocess, doesDataMatch: (data: string) => unknown, onReady?: () => void): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const handler = (data: unknown) => {
            const strippedData = stripAnsi(String(data))
            if (doesDataMatch(strippedData)) {
                child?.stdout?.off('data', handler)
                child?.stderr?.off('data', errorHandler)
                resolve(strippedData)
            }
        }
        const errorHandler = (data: unknown) => {
            const strippedData = stripAnsi(String(data).replace(/(?:\r\n|\n|\r)/g, ''))
            if (strippedData) {
                child?.stdout?.off('data', handler)
                child?.stderr?.off('data', errorHandler)
                reject(strippedData)
            }
        }
        child?.stdout?.on('data', handler)
        child?.stderr?.on('data', errorHandler)
        onReady?.()
    })
}
