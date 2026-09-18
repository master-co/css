import type { DevEnvironment, ErrorPayload } from 'vite'

export function sendRecoveryError(environment: DevEnvironment, error: unknown, id: string) {
  const failure = (error && typeof error === 'object' ? error : { message: String(error) }) as Partial<ErrorPayload['err']>
  environment.hot.send({ type: 'error', err: {
    message: failure.message ?? String(error), stack: failure.stack ?? '',
    id: failure.id ?? id, frame: failure.frame, plugin: failure.plugin,
    pluginCode: failure.pluginCode, loc: failure.loc
  } })
}
