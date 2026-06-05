import define from 'internal/utils/metadata'

const metadata = define({
    title: {
        absolute: 'Code Linting for Master CSS'
    },
    description: 'An ESLint integration for enforcing team coding styles, making your template markup more organized, and catching syntax errors early.',
    category: 'Getting Started',
    other: {
        subject: 'Code Linting'
    },
    order: 5,
    openGraph: {
        description: 'An ESLint plugin enforcing a consistent coding style for Master CSS.'
    },
    vercelOG: true,
    fileURL: import.meta.url
})

export default metadata
