import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function Content() {
    return (
        <>
            <ClassTable names={[
                 ['content:`value`|`…`'],
                 ['content:normal'],
                 ['content:none'],
                 ['content:no-open-quote'],
                 ['content:no-close-quote'],
                 ['content:url(`…`)'],
                 ['content:linear-gradient(`…`)'],
                 ['content:image-set(`…`)'],
                 ['content:counter(`…`)'],
                 ['content:attr(`…`)']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>content</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                replaces an element with a generated value.
                Objects inserted using the <code>content</code> property are <strong>anonymous&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element" target="blank">replacedelements</a></strong>.
            </p>
            <StyleEditor
                tag="p"
                className="content:\'%\'::after"
                names={[
                    'content:url(\'/images/checkbox.svg\')::before',
                    'content:attr(customAttr)::before',
                    'content:\'%\'::after',
                    'content:none',
                    'content:normal',
                ]}
                renderHtml={(className: string) => `
                    <p class="**${className}** ..f:30 p:5 grid-col-span:2 word-spacing:4 m:auto t:center.." customAttr="👍">
                        <span class="f:blue-60!">Virtual CSS</span>
                    </p>
                `} />
            <StyleFunctions name="content:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="content:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="content:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="content:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="content:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.content'

Content.page = {
    layout: CssDoc,
    title: 'Content',
    description: 'The content CSS property replaces an element with a generated value. Objects inserted using the content property are anonymous replacedelements.',
    editors: ['Aron','Lola'],
    localeNamespace
,
    mdn: true,
    canIUse: true
};

export async function getStaticProps({ locale }: any) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common', 'css', localeNamespace])),
        },
    };
};