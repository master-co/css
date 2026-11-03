import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ObjectFit() {

    return (
        <>
            <ClassTable names={[
                 ['object-fit:`value`', 'object:`value`', 'obj:`value`'],
                 ['object-fit:none'],
                 ['obj:contain'],
                 ['obj:cover'],
                 ['obj:fill'],
                 ['obj:scale-down']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>object-fit</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the content of a <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/Replaced_element" target="blank">replaced element</a>,
                such as an <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img" target="blank"><code>&lt;img&gt;</code></a>&nbsp;
                or <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video" target="blank"><code>&lt;video&gt;</code></a>, should be resized to fit
                its container.
            </p>
            <StyleEditor
                tag="div"
                className="object-fit:none"
                names={[
                    'object-fit:none',
                    'obj:cover',
                    'obj:contain',
                    'obj:fill',
                    'obj:scale-down'
                ]}
                renderHtml={(className: string) => `
                <div class="flex ..w:full align-items:center! justify-content:center!..">
                    <div class="w:50%">
                        <div class="w:full ..align-items:center stripe-bg r:5..">
                            <img src="../images/foods/pie.jpg.." class="**${className}** min-w:full aspect:4/3">
                        </div>
                    </div>
                </div>
                `} />
            <StyleFunctions name="object-fit:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="object-fit:fill:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="object-fit:fill@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="object-fit:fill@print"></StyleMediaQueries>
            <StyleColorSchemes name="object-fit:fill@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.object-fit'

ObjectFit.page = {
    layout: CssDoc,
    title: 'Object Fit',
    description: 'The object-fit CSS property sets the content of a replaced element, such as an <img>  or <video>, should be resized to fit its container.',
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