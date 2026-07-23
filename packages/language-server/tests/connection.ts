import { Duplex, DuplexOptions } from 'stream'
import { createConnection, createProtocolConnection } from 'vscode-languageserver/node'
import { MasterCSSLanguageServer, type MasterCSSLanguageServerSettings } from '../src'

export function connect(settings?: MasterCSSLanguageServerSettings) {
  const duplexOptions = {
    write(chunk, encoding, callback) {
      this.emit('data', chunk)
      callback()
    },

    read() {}
  } as DuplexOptions
  const input = new Duplex(duplexOptions)
  const output = new Duplex(duplexOptions)
  const serverConnection = createConnection(input, output)
  const clientConnection = createProtocolConnection(output, input)
  const server = new MasterCSSLanguageServer(serverConnection, settings)
  server.start()
  clientConnection.listen()
  return {
    server,
    clientConnection,
    serverConnection,
  }
}
