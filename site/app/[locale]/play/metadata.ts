import define from '~/internal/utils/metadata'

const metadata= define({
  title: 'Play',
  description: 'A real-time code editor for Master CSS.',
  category: `v${process.env.NEXT_PUBLIC_VERSION}`,
  openGraph: {
    title: 'Playground'
  },
  fileURL: import.meta.url
})

export default metadata