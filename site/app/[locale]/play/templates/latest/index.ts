import { nanoid } from 'nanoid'
import exampleHTML from './example.html' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }
import exampleCSS from '../../../../../.generated/raw/play-example.css.txt' with { turbopackLoader: 'raw-loader', turbopackAs: '*.js' }

export default {
  version: process.env.NEXT_PUBLIC_VERSION,
  files: [
    {
      title: 'HTML',
      name: 'index.html',
      language: 'html' as const,
      id: nanoid(),
      content: exampleHTML
    },
    {
      title: 'CSS',
      name: 'index.css',
      language: 'css' as const,
      id: nanoid(),
      content: exampleCSS
    }
  ]
}
