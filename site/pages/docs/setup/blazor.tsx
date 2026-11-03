import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import HelloWorldSection from '~/components/Css/HelloWorld'
import InstallStyles from '~/components/Css/InstallStyles'
import CssDoc from '~/layouts/CssDoc'
import BlazorSvg from '~/public/images/frameworks/blazor.svg'
import { iconGuide } from '~/styles/icon-guide'

export default function Blazor() {
    return (
        <>
            <BlazorSvg className={iconGuide + ' scale(1.3)'} />
            <p>A quick guide to start using Master CSS in your Blazor project.</p>
            <h2 id="quick-start">Quick start</h2>
            <h3 id="create-a-project">1. Create a Blazor app</h3>
            <p>
                If you don&#39;t have a Blazor app project, create one first. It&#39;s recommended to refer <a href="https://dotnet.microsoft.com/en-us/learn/aspnet/blazor-tutorial/create" target="blank">Build your first Blazor app</a> :
            </p>
            <Code lang="bash">
                {`
                    dotnet new blazorserver -o __project__ --no-https -f net6.0
                    cd __project__
                `}
            </Code>
            <h3 id="initialize-npm">2. Initialize NPM</h3>
            <p>Add a new folder named npm_packages.</p>
            <Code lang="bash">
                {`
                    mkdir __npm_packages__
                    cd __npm_packages__
                    npm init -y
                    npm install webpack webpack-cli --save-dev
                `}
            </Code>
            <p>Add an npm build script on script section of the package.json file.</p>
            <Code lang="tsx" name="npm_packages/package.json" addLines={[5]} lineNumbers>
                {`
                    {
                        ...
                        scripts: {
                            ...
                            "build": "webpack ./src/index.js --output-path ../wwwroot/js --output-filename index.bundle.js --mode=development"
                        }
                    }
                `}
            </Code>
            <h3 id="installation">3. Installation</h3>
            <InstallStyles />
            <h3 id="build">4. Build</h3>
            <Code lang="bash">
                {`
                    npm run build
                `}
            </Code>
            <p>Modify __project__.csproj file to add following pre-build step</p>
            <Code lang="html" name="project.csproj" addLines={[3,4,5,6]} lineNumbers>
                {`
                <Project>
                    ...
                    <Target Name="PreBuild" BeforeTargets="PreBuildEvent">
                        <Exec Command="npm install" WorkingDirectory="__npm_packages__" />
                        <Exec Command="npm run build" WorkingDirectory="__npm_packages__" />
                    </Target>
                    ...
                </Project>
                `}
            </Code>
            <h3 id="import">5. Import</h3>
            <Code lang="html" name="Pages/_Layout.cshtml" addLines={[6]} lineNumbers>
                {`
                <html>
                    ...
                    <body>
                        ...
                        <script src="_framework/blazor.server.js"></script>
                        <script src="js/index.bundle.js"></script>
                    </body>
                </html>
                `}
            </Code>
            <h3 id="launch-server">6. Launch server</h3>
            <Code lang="bash">
                {`
                    cd __project__
                    dotnet watch
                `}
            </Code>
            <h3 id="hello-world">Hello world</h3>
            <HelloWorldSection url="localhost:3000"></HelloWorldSection>
            <Code lang="tsx" name="Pages/Index.razor" addLines={[5, 6, 7]} lineNumbers>
                {`
                    @page "/"

                    <PageTitle>Index</PageTitle>

                    <h1 class="font:40 font:heavy italic m:50 text:center">
                        Hello World
                    </h1>

                    Welcome to your new app.

                    <SurveyPrompt Title="How is Blazor working for you?" />
                `}
            </Code>
            {/* <h2 id="hybrid-rendering">Hybrid rendering</h2>
            <p>
                We devised a <b>hybrid architecture</b> that allows you to <b>pre-generate CSS from HTML</b> on the server
                side, and then continue to use <b>JIT</b> on the client side by reverse parsing.
            </p>
            <p><i>More to come ...</i> 🚧</p> */}
        </>
    )
}

const localeNamespace = 'docs.css.blazor'

Blazor.page = {
    layout: CssDoc,
    title: 'Set up Master CSS in Blazor',
    description: 'A quick guide to start using Master CSS in your Blazor project.',
    suffix: '',
    h1ClassName: 'mr:110',
    subtitle: 'Getting Started',
    editors: ['Joy'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};
