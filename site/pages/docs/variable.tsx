import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Code from '~/components/Code'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Variable() {

    return (
        <>
            <ClassTable names={[
                    ['$`key`:`value`']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                CSS variables are entities defined by CSS authors that contain specific values to be reused throughout a document.
                <br/>
                Custom properties are subject to <strong>the cascade and inherit their value from their parent</strong>.
                <br/>
                This virtual variable style will <b>make Shadow DOM responsive and customizable in style</b>.
            </p>

            <StyleEditor
                tag="div"
                className="$size:2.5rem"
                showCss="true"
            />
            
            <h2 id="basic-usage">Basic usage</h2>
            <h3 id="stylize-a-shadow-dom">Stylize a shadow dom</h3>
            <p>Let&#39;s say this&#39;s your custom element and its tree:</p>
            <Code lang="html">
                {`
                    <test-element>
                        ▼ #shadow-root (open)
                          <button part="button"></button>
                    </test-element>
                `}
            </Code>
            <p>and the element contains an encapsulated style like this:</p>
            <Code lang="css">
                {`
                    :host {
                        --button-bg: red;
                    }

                    [part=button] {
                        background: var(--button-bg);
                    }
                `}
            </Code>
            <p>Elements in the shadow DOM cannot be selected via descendant selectors, but you can:</p>
            <Code lang="html">
                {`
                    <test-element class="**$button-bg**:red **$button-bg**:pink@sm">
                        ▼ #shadow-root (open)
                          <button part="button"></button>
                    </test-element>
                `}
            </Code>

            <StyleFunctions name="$size:$(custom-size)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="$size:2.5rem:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="$size:2.5rem@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="$size:2.5rem@print"></StyleMediaQueries>
            <StyleColorSchemes name="$size:2.5rem@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.variable'

Variable.page = {
    layout: CssDoc,
    title: 'Variable',
    description: 'CSS variables are entities defined by CSS authors that contain specific values to be reused throughout a document.',
    editors: ['Aron','Lola'],
    localeNamespace,
    mdn: 'Using_CSS_custom_properties',
    canIUse: 'CSS Custom Properties'
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
}
