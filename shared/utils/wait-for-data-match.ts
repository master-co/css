import { SpawndChildProcess, spawnd } from 'spawnd'

export default function (child: SpawndChildProcess, doesDataMatch: (data: string) => any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const handler = (data) => {
            if (doesDataMatch(data.toString())) {
                child.stdout.off('data', handler)
                child.stderr.off('data', errorHandler)
                resolve(data.toString())
            }
        }
        const errorHandler = (data) => {
            child.stdout.off('data', handler)
            child.stderr.off('data', errorHandler)
            reject(data.toString())
        }
        child.stdout.on('data', handler)
        child.stderr.on('data', errorHandler)
    })
}