import CodeTabs from '../Code/CodeTabs'

const InstallStyles = () => {
    return (
        <>
            <CodeTabs>{[
                {
                    name: 'npm', lang: 'bash',
                    code: 'npm install **@master/css**'
                },
                {
                    name: 'yarn', lang: 'bash',
                    code: 'yarn add **@master/css**'
                },
                {
                    name: 'pnpm', lang: 'bash',
                    code: 'pnpm install **@master/css**'
                }
            ]}</CodeTabs>
        </>
    )
}

export default InstallStyles
