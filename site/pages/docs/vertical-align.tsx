import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Image from 'next/image'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function VerticalAlign() {

    return (
        <>
            <ClassTable names={[
                ['vertical-align:`value`', 'vertical:`value`', 'v:`value`'],
                ['vertical:baseline'],
                ['vertical:bottom'],
                ['vertical:middle'],
                ['vertical:sub'],
                ['vertical:super'],
                ['vertical:text-bottom',],
                ['vertical:text-top'],
                ['vertical:top']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>vertical-align</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets vertical alignment of an inline, inline-block or table-cell box.
            </p>
            <StyleEditor
                tag="p"
                className="v:$(value)"
            >
                {
                    <div className="grid-cols:4! gap-y:20 gap-x:15 p:32|32|3|32">
                        {
                            [
                                'v:baseline',
                                'v:middle',
                                'v:sub',
                                'v:super',
                                'v:text-bottom',
                                'v:bottom',
                                'v:text-top',
                                'v:top'
                            ].map((className: string) => {
                                return (
                                    <div key={className} className="flex flex:col align-items:center">
                                        <code className="bg:fade-90 bg:fade-88:hover bg:gray-20@dark bg:gray-22:hover@dark r:3 p:5|8 f:12">
                                            {className}
                                        </code>
                                        <p className="f:20 f:gray-34 mt:10 d:inline t:underline|overline|1 t:center">
                                            Master
                                            <Image width="10" height="10" src="/images/circle.svg" className={className + ' inline'} alt="dot" />
                                        </p>
                                    </div>
                                )
                            })
                        }
                    </div>
                }

            </StyleEditor>
            <StyleFunctions name="v:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="v:baseline:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="v:baseline@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="v:baseline@print"></StyleMediaQueries>
            <StyleColorSchemes name="v:baseline@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.vertical-align'

VerticalAlign.page = {
    layout: CssDoc,
    title: 'Vertical Align',
    description: 'The vertical-align CSS property sets vertical alignment of an inline, inline-block or table-cell box.',
    editors: ['Aron', 'Lola'],
    localeNamespace,
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