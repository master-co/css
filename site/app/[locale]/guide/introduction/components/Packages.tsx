import Link from 'internal/components/Link'

const mainPackages = [
    await import('~/packages/core/package.json'),
    await import('~/packages/runtime/package.json'),
    await import('~/packages/server/package.json'),
    await import('~/packages/extractor/package.json'),
    await import('~/packages/validator/package.json'),
    await import('~/packages/cli/package.json'),
    await import('~/packages/create/package.json'),
]

const integrationPackages = [
    await import('~/packages/react/package.json'),
    await import('~/packages/svelte/package.json'),
    await import('~/packages/vue/package.json'),
    await import('~/packages/nuxt/package.json'),
    await import('~/packages/extractor.vite/package.json'),
    await import('~/packages/extractor.webpack/package.json')
]

const developerToolPackages = [
    await import('~/packages/eslint-config/package.json'),
    await import('~/packages/eslint-plugin/package.json'),
    await import('~/packages/language-server/package.json'),
    await import('~/packages/language-service/package.json'),
    await import('~/packages/vscode/package.json'),
    await import('~/packages/language/package.json'),
]

const solutionPackages = [
    await import('~/site/node_modules/@master/colors/package.json'),
    await import('~/site/node_modules/@master/normal.css/package.json'),
    await import('~/site/node_modules/theme-mode/package.json'),
    await import('~/site/node_modules/class-variant/package.json'),
]

export default () => {
    const Tr = ({ children }: any) => (
        <tr>
            <th>
                <Link href={'https://github.com/master-co/css/tree/rc/' + children.repository.directory} indicate>
                    {children.name}
                </Link>
            </th>
            <td>{children.description}</td>
        </tr>
    )
    return (
        <table>
            <thead>
                <tr>
                    <th>Package</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colSpan={2}><small>Main</small></td>
                </tr>
                {mainPackages.map((eachPackage) => <Tr key={eachPackage.name}>{eachPackage}</Tr>)}
                <tr>
                    <td colSpan={2}><small>Integrations</small></td>
                </tr>
                {integrationPackages.map((eachPackage) => <Tr key={eachPackage.name}>{eachPackage}</Tr>)}
                <tr>
                    <td colSpan={2}><small>Developer Tools</small></td>
                </tr>
                {developerToolPackages.map((eachPackage) => <Tr key={eachPackage.name}>{eachPackage}</Tr>)}
                <tr>
                    <td colSpan={2}><small>Other Solutions</small></td>
                </tr>
                {solutionPackages.map((eachPackage) => (
                    <tr key={eachPackage.name}>
                        <th>
                            <Link href={eachPackage.repository.url} indicate>
                                {eachPackage.name}
                            </Link>
                        </th>
                        <td>{eachPackage.description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}