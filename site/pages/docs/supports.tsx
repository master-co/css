import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Code from '~/components/Code'
import CodeHTML2CSS from '~/components/Code/CodeHTML2CSS';
import ReferenceTable from '~/components/Css/ReferenceTable'
import ShorthandList from '~/components/Css/ShorthandList';
import StyleEditor from '~/components/Css/StyleEditor';
import CssDoc from '~/layouts/CssDoc'

export default function Supports() {

    return (
        <>
            <p>
                The <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/@supports" target="blank">@supports</a> CSS at-rule 
                lets you specify declarations that depend on a browser&rsquo;s support for one or more specific CSS features.
                This is called a feature query. 
                The rule may be placed at the top level of your code or nested inside any other conditional group at-rule.
            </p>

            <h2 id="syntax">Syntax</h2>
            <CodeHTML2CSS>
                {`
                    <div class="bg:gray-1**@supports(<stylesheet>)**">...</div>
                `}
            </CodeHTML2CSS>
            
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="property-support">Property support</h3>
            <CodeHTML2CSS>
                {`
                    <div class="bg:gray-1**@supports(backdrop-filter:none)**">...</div>
                `}
            </CodeHTML2CSS>
            <h3 id="selector-support">Selector support</h3>
            <CodeHTML2CSS>
                {`
                    <div class="pr:10**@supports_selector(::scrollbar)**">...</div>
                `}
            </CodeHTML2CSS>
            <h2 id="operator">Operator</h2>
            <h3 id="not-operator">Not Operator</h3>
            <CodeHTML2CSS>
                {`
                    <div class="pr:10**@supports(backdrop-filter:none)not(display:inline)**">...</div>
                `}
            </CodeHTML2CSS>
            <h3 id="and-operator">And Operator</h3>
            <CodeHTML2CSS>
                {`
                    <div class="pr:10**@supports(backdrop-filter:none)and(display:inline)**">...</div>
                `}
            </CodeHTML2CSS>
            <h3 id="or-operator">Or Operator</h3>
            <CodeHTML2CSS>
                {`
                    <div class="pr:10**@supports(backdrop-filter:none)or(display:inline)**">...</div>
                `}
            </CodeHTML2CSS>
        </>
    )
}

const localeNamespace = 'docs.css.supports'

Supports.page = {
    layout: CssDoc,
    title: 'Supports',
    description: 'The @supports CSS at-rule lets you specify declarations that depend on a browser’s support for one or more specific CSS features. This is called a feature query. The rule may be placed at the top level of your code or nested inside any other conditional group at-rule.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: '@supports',
    canIUse: '@supports'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}

