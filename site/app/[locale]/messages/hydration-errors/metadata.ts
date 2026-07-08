import define from 'internal/utils/metadata'

const metadata = define({
  title: 'Hydration Errors',
  description: 'There was a difference between the CSS rules that was pre-rendered from the server and the Master CSS rules that was rendered during the first render in the browser.',
  category: 'Errors',
  fileURL: import.meta.url
})

export default metadata