import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import { Trans } from 'next-i18next';
import VisualstudiocodeSvg from '~/public/icons/visualstudiocode.svg';

export default function DeveloperTools({ t }: any) {
    return (
        <>
            <p>
                Improve your development experience and productivity with developer tools and extensions.
            </p>
            <h2 id="language-service">Language Service</h2>
            <div className="blend:lighten@dark">
                <Image src="/images/syntax-highlight.jpg" width="750" height="260" alt="syntax highlight" />
            </div>
            <p>The official <a href="https://marketplace.visualstudio.com/items?itemName=masterco.master-css-language-service" target="blank">Master CSS Language Service</a> extension for Visual Studio Code upgrades your development experience, and provides many advanced features:</p>
            <h3 id="code-completion">Code-completion</h3>
            <p>Smart suggestions for style names, values, semantics and selectors.</p>
            <video className="aspect:16/9 blend:lighten@dark my:20 scale(1.1):hover ~transform|.3s" playsInline preload='none' autoPlay loop muted>
                <source src="/videos/code-completion.mp4" type="video/mp4" />
            </video>
            <h3 id="syntax-highlighting">Syntax highlighting</h3>
            <p>Highlight class names to make them easier to read and identify.</p>
            <figure className="blend:lighten@dark my:20 scale(1.1):hover ~transform|.3s">
                <Image src="/images/syntax-highlighting.jpg" width="800" height="450" alt="syntax highlighting"></Image>
            </figure>
            <h3 id="generate-preview">Generate preview</h3>
            <p>Hover over Master class names to see their CSS generation.</p>
            <video className="aspect:16/9 blend:lighten@dark my:20 scale(1.1):hover ~transform|.3s" playsInline preload='none' autoPlay loop muted>
                <source src="/videos/rendering-preview.mp4" type="video/mp4" />
            </video>
            <p>Master CSS has pioneered applying syntax highlighting to class names in markup, which solves the problem of unreadable classes that are too long.</p>
            <a className="filledBtn px:20 h:48 f:14 f:semibold r:4 lh:1 flex:row!" href="vscode:extension/masterco.master-css-language-service">
                <VisualstudiocodeSvg className="ml:-4 mr:10" width="20" height="20" />
                {t('Install to Visual Studio Code now')}
            </a>
        </>
    )
}

const localeNamespace = 'docs.css.developer-tools'

DeveloperTools.page = {
    layout: CssDoc,
    title: 'Developer Tools',
    description: 'Improve your development experience and productivity with developer tools and extensions.',
    subtitle: 'Getting Started',
    editors: ['Aron'],
    localeNamespace
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}