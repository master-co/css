import { Metadata } from 'websites/types/Metadata'
import ogImageIcon from '~/public/images/cover-bg.jpg'

console.log(ogImageIcon)

const metadata: Metadata = {
    title: 'Install Master CSS ESLint with Laravel',
    description: 'Guide to installing Master CSS ESLint in your Laravel project.',
    category: 'Code Linting',
    ogImageTitle: 'Master CSS ESLint',
    ogImageIcon: new URL('public/images/frameworks/laravel.svg', import.meta.url),
    ogImageIconWidth: 192
}

export default metadata