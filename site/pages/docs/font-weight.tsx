import ClassTable from '~/components/Css/ClassTable'
import TextList from '~/components/Css/TextList'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function FontWeight() {
    return (
        <>
            <ClassTable names={[
                ['font-weight:`weight`', 'font:`weight`', 'f:`weight`'],
                ['font-weight:normal'],
                ['font:lighter'],
                ['font:bolder'],
                ['font:thin'],
                ['font:extralight'],
                ['font:light'],
                ['font:regular'],
                ['font:medium'],
                ['font:semibold'],
                ['font:bold'],
                ['font:extrabold'],
                ['font:heavy']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font weight</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the weight (or boldness) of the font. The weights available depend on the&nbsp;
                <a href="font-family">font-family</a> that is currently set.
            </p>
            <TextList
                showClasses={[
                    'font:thin',
                    'font:extralight',
                    'font:light',
                    'font:regular',
                    'font:medium',
                    'font:semibold',
                    'font:bold',
                    'font:extrabold',
                    'font:heavy',
                    'font:normal',
                    'font:lighter',
                    'font:bolder'
                ]}
                renderClasses="f:50 my:0!"
            >
            </TextList>
            <StyleFunctions name="font-weight:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font-weight:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font-weight:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font-weight:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="font-weight:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.font-weight'

FontWeight.page = {
    layout: CssDoc,
    title: 'Font Weight',
    description: 'The font weight CSS property sets the weight (or boldness) of the font. The weights available depend on the font-family that is currently set.',
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

