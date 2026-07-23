import { MasterCSSLanguageServer } from './core'

const server = new MasterCSSLanguageServer(undefined, { verbose: true })

server.start()

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection', error)
})
