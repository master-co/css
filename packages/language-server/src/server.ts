import CSSLanguageServer from './core'

const server = new CSSLanguageServer(undefined, { verbose: true })

server.start()

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection', error)
})
