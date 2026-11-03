/* eslint-disable @next/next/no-img-element */
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function MixBlendMode() {


    return (
        <>
            <ClassTable names={[
                ['mix-blend-mode:`mode`', 'blend:`mode`'],
                ['blend:normal'],
                ['blend:multiply'],
                ['blend:screen'],
                ['blend:overlay'],
                ['blend:darken'],
                ['blend:lighten'],
                ['blend:color-dodge'],
                ['blend:color-burn'],
                ['blend:hard-light'],
                ['blend:soft-light'],
                ['blend:difference'],
                ['blend:exclusion'],
                ['blend:hue'],
                ['blend:saturation'],
                ['blend:color'],
                ['blend:luminosity']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>mix-blend-mode</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets how an element&#39;s content should blend with the content of the element&#39;s parent and the element&#39;s background.
            </p>
            <div className="demo justify-content:start! grid-cols:4! gap:20">
                {
                    [
                        'blend:normal',
                        'blend:multiply',
                        'blend:screen',
                        'blend:overlay',
                        'blend:darken',
                        'blend:lighten',
                        'blend:color-dodge',
                        'blend:color-burn',
                        'blend:hard-light',
                        'blend:soft-light',
                        'blend:difference',
                        'blend:exclusion',
                        'blend:hue',
                        'blend:saturation',
                        'blend:color',
                        'blend:luminosity'
                    ].map((className: string) => {
                        return (
                            <div key={className} className="flex flex:col w:full align-items:center">
                                <code className="f:12 mb:10">{className}</code>
                                <div className="round bg:fade-70/.8 bg:gray-60/.8@dark w:68.75% aspect:1/1">
                                    <img src="/images/wallpaper.jpg" className={`${className} round w:68.75% aspect:1/1 ml:-35% mt:15%`} alt="wallpaper" />
                                </div>

                            </div>
                        )
                    })
                }
            </div>
            <StyleFunctions name="blend:$(mode)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="blend:normal:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="blend:normal@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="blend:normal@print"></StyleMediaQueries>
            <StyleColorSchemes name="blend:normal@dark"></StyleColorSchemes>
        </>
    )
}
const localeNamespace = 'docs.css.mix-blend-mode'

MixBlendMode.page = {
    layout: CssDoc,
    title: 'Mix Blend Mode',
    description: 'The mix-blend-mode CSS property sets how an element\'s content should blend with the content of the element\'s parent and the element\'s background.',
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
