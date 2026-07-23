import stripAnsi from 'strip-ansi'
import { Subprocess } from 'execa'

export default function waitForDataMatch(child: Subprocess, doesDataMatch: (data: string) => unknown, onReady?: () => void): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const cleanup = () => {
      child?.stdout?.off('data', handler)
      child?.stderr?.off('data', handler)
      child?.off('exit', exitHandler)
    }
    const handler = (data: unknown) => {
      const strippedData = stripAnsi(String(data))
      if (doesDataMatch(strippedData)) {
        cleanup()
        resolve(strippedData)
      }
    }
    const exitHandler = (code: number | null) => {
      cleanup()
      reject(new Error(`Process exited with code ${code ?? 'unknown'} before expected output.`))
    }
    child?.stdout?.on('data', handler)
    child?.stderr?.on('data', handler)
    child?.once('exit', exitHandler)
    onReady?.()
  })
}
