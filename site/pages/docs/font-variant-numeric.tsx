import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function FontVariantNumeric() {
    return (
        <>
            <ClassTable names={[
                ['font-variant-numeric:`value`', 'font:`value`', 'f:`value`'],
                ['font:normal'],
                ['font:ordinal'],
                ['font:slashed-zero'],
                ['font:lining-nums'],
                ['font:oldstyle-nums'],
                ['font:proportional-nums'],
                ['font:tabular-nums'],
                ['font:diagonal-fractions'],
                ['font:stacked-fractions']
            ]}>
            </ClassTable>

            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>font-variant-numeric</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property 
                controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
            </p>
            <StyleEditor
                tag="p"
                className="font:normal"
                names={[
                    'font:normal',
                    'font:ordinal',
                    'font:slashed-zero',
                    'font:lining-nums',
                    'font:oldstyle-nums',
                    'font:proportional-nums',
                    'font:tabular-nums',
                    'font:diagonal-fractions',
                    'font:stacked-fraction'
                ]}
                renderHtml={(className: string) => `
                <div class="..flex w:full h:100 p:10..">
                    <div class="f:24 **${className}** ..m:auto..">
                        ${ 
                            className === 'font:ordinal' ? '1st, 2nd' : 
                            className === 'font:diagonal-fractions' || className === 'font:stacked-fraction'  ? '1/2 4/3' : 
                            '0123-456-789' }
                    </div>
                </div>
                `} />
            <StyleFunctions name="font-variant-numeric:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="font-variant-numeric:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="font-variant-numeric:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="font-variant-numeric:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="font-variant-numeric:normal@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.font-variant-numeric'


FontVariantNumeric.page = {
    layout: CssDoc,
    title: 'Font Variant Numeric',
    description: 'The font-variant-numeric CSS property controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.',
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

