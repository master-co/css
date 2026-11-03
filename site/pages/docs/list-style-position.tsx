import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ListStylePosition() {

    return (
        <>
            <ClassTable names={[
                ['list-style-position:`position`'],
                ['list-style:inside'],
                ['list-style:outside']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>list-style-position</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets the position of the&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/::marker" target="blank"><code>::marker</code></a> relative to a list item.
            </p>
            <StyleEditor
                tag="p"
                className="list-style:inside"
                names={[
                    'list-style:inside',
                    'list-style:outside'
                ]}
                renderHtml={(className: string) => `
                <div class="f:blue-60!_:where(li)::marker f:30!_:where(li)::marker lh:1.5!_:where(li)::marker lh:1.5!_:where(li) ..flex flex:col w:full align-items:center..">
                    <ol class="**${className}** ..articleBox t:left w:1/2${ className === 'list-style:outside' ? ' pl:0' : ''}.."> 
                        <li>First</li>
                        <li>Second</li>
                        <li>Third</li>
                    </ol>
                </div>
                `} />
            <StyleFunctions name="list-style-position:$(position)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="list-style-position:inside:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="list-style-position:inside@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="list-style-position:inside@print"></StyleMediaQueries>
            <StyleColorSchemes name="list-style-position:inside@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.list-style-position'

ListStylePosition.page = {
    layout: CssDoc,
    title: 'List Style Position',
    description: 'The list-style-position CSS property sets the position of the ::marker relative to a list item.',
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

