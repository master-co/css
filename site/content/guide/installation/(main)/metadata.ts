import define from '@master/internal-site/utils/metadata'

const metadata = define({
  title: {
    absolute: 'Installing Master CSS'
  },
  description: 'Choose a framework integration, check CDN availability, or generate a stylesheet with the CLI.',
  category: 'Getting started',
  openGraph: { images: '/images/integrations/installation-og.png' },
  order: 2,
  other: {
    subject: 'Installation'
  },
  fileURL: import.meta.url
})

export default metadata
