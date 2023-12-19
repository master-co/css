import { Metadata } from 'websites/types/Metadata'
import version from '~/version'

const metadata: Metadata = {
    title: 'Master CSS Play',
    description: 'A real-time code editor for Master CSS.',
    category: `v${version}`,
    openGraph: {
        title: 'Playground'
    }
}

export default metadata