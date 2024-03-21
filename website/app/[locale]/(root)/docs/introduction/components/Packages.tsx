import Link from 'websites/components/Link'

const mainPackages = [
    require('~/../packages/css/package.json'),
    require('~/../packages/runtime/package.json'),
    require('~/../packages/server/package.json'),
    require('~/../packages/extractor/package.json'),
    require('~/../packages/validator/package.json'),
    require('~/../packages/cli/package.json'),
    require('~/../packages/create/package.json'),
]

const integrationPackages = [
    require('~/../packages/react/package.json'),
    require('~/../packages/svelte/package.json'),
    require('~/../packages/vue/package.json'),
    require('~/../packages/nuxt/package.json'),
    require('~/../packages/extractor.vite/package.json'),
    require('~/../packages/extractor.webpack/package.json')
]

const developerToolPackages = [
    require('~/../packages/eslint-config/package.json'),
    require('~/../packages/eslint-plugin/package.json'),
    require('~/../packages/language-server/package.json'),
    require('~/../packages/language-service/package.json'),
    require('~/../packages/vscode/package.json'),
]

const solutionPackages = [
    require('~/node_modules/@master/colors/package.json'),
    require('~/node_modules/@master/normal.css/package.json'),
    require('~/node_modules/theme-mode/package.json'),
    require('~/node_modules/class-variant/package.json'),
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