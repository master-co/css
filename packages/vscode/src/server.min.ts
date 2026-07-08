import CSSLanguageServer from '@master/css-language-server'

const server = new CSSLanguageServer(undefined, { verbose: true })

server.start()

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection', error)
})
