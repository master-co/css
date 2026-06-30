import define from 'internal/utils/metadata'

const metadata = define({
    title: {
        absolute: 'Code Linting for Master CSS'
    },
    description: 'An ESLint integration for enforcing team coding styles, making your template markup more organized, and catching syntax errors early.',
    category: 'Agentic Workflows',
    other: {
        subject: 'Code Linting'
    },
    order: 2,
    openGraph: {
        description: 'An ESLint plugin enforcing a consistent coding style for Master CSS.'
    },
    fileURL: import.meta.url
})

export default metadata
