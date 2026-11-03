import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import BoxList from '~/components/Css/BoxList'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function BorderRadius() {

    return (
        <>
            <ClassTable names={[
                  ['border-radius:`radius`', 'r:`radius`'],
                  ['border-radius:`radius`|`radius`', 'r:`radius`|`radius`'],
                  ['border-radius:`radius`|`radius`|`radius`|`radius`', 'r:`radius`|`radius`|`radius`|`radius`'],
                  ['rt:`radius`'],
                  ['rt:`radius`|`radius`'],
                  ['rb:`radius`'],
                  ['rb:`radius`|`radius`'],
                  ['rl:`radius`'],
                  ['rl:`radius`|`radius`'],
                  ['rr:`radius`'],
                  ['rr:`radius`|`radius`'],
                  ['rtl:`radius`', 'rlt:`radius`'],
                  ['rtl:`radius`|`radius`', 'rlt:`radius`|`radius`'],
                  ['rtr:`radius`', 'rrt:`radius`'],
                  ['rtr:`radius`|`radius`', 'rrt:`radius`|`radius`'],
                  ['rbl:`radius`', 'rlb:`radius`'],
                  ['rbl:`radius`|`radius`', 'rlb:`radius`|`radius`'],
                  ['rbr:`radius`', 'rrb:`radius`'],
                  ['rbr:`radius`|`radius`', 'rrb:`radius`|`radius`'],
                  ['rounded'],
                  ['round']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>border-radius</code></strong>&nbsp;<a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                sets rounds the corners of an element&rsquo;s outer border edge. 
                You can set a single radius to make circular corners, or two radii to make elliptical corners.
            </p>
            <BoxList
                showClasses={[
                    'r:0',
                    'r:10',
                    'r:20|20',
                    'r:20|40|40|20',
                    'round',
                    'rounded',
                    'rt:20',
                    'rt:20|40',
                    'rb:20',
                    'rb:20|40',
                    'rl:20',
                    'rr:20',
                    'rtl:20',
                    'rtl:20|40',
                    'rbl:20',
                    'rbl:20|40',
                    'rbr:20',
                    'rtr:20',
                ]}
                renderClasses="b:5|solid|blue-60">
            </BoxList>
          
            <StyleFunctions name="border-radius:$(radius)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="border-radius:10:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="border-radius:10@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="border-radius:10@print"></StyleMediaQueries>
            <StyleColorSchemes name="border-radius:10@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.border-radius'

BorderRadius.page = {
    layout: CssDoc,
    title: 'Border Radius',
    description: 'The border-radius CSS property sets rounds the corners of an element’s outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners.',
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
