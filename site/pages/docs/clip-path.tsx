import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleEditor from '~/components/Css/StyleEditor'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'

export default function ClipPath() {

    return (
        <>
            <ClassTable names={[
                ['clip-path:`value`', 'clip:`value`'],
                ['clip:none'],
                ['clip:margin'],
                ['clip:border'],
                ['clip:padding'],
                ['clip:content'],
                ['clip:fill'],
                ['clip:stroke'],
                ['clip:view'],
                ['clip:inset(`…`)'],
                ['clip:circle(`…`)'],
                ['clip:ellipse(`…`)'],
                ['clip:polygon(`…`)'],
                ['clip:path(`…`)'],
                ['clip:url(`…`)']
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>clip-path</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                creates a clipping region that sets what part of an element should be shown.
                Parts that are inside the region are shown, while those outside are hidden.
            </p>
            <StyleEditor
                tag="div"
                className="clip:none"
                names={[
                    'clip:none',
                    'clip:inset(20px|40px)',
                    'clip:circle(50px|at|60px|90px)',
                    'clip:ellipse(50px|70px|at|60px|90px)',
                    'clip:polygon(70%|0,100%|70%,30%|100%,0|30%)'
                ]}
                renderHtml={(className: string) => `
                <div class="
                    w:full h:200 
                    bg:gray-20/.9|url('/images/wallpaper.jpg')|center/cover 
                    background-blend-mode:multiply!">
                    <div class="
                        **${className}** 
                        h:full 
                        bg:url('/images/wallpaper.jpg')|center/cover">
                    </div>
                </div>
                `} />
            <StyleFunctions name="clip:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="clip:inset(0|20px):hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="clip:inset(0|20px)@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="clip:inset(0|20px)@print"></StyleMediaQueries>
            <StyleColorSchemes name="clip:inset(0|20px)@dark"></StyleColorSchemes>
        </>
    )
}

const localeNamespace = 'docs.css.clip-path'

ClipPath.page = {
    layout: CssDoc,
    title: 'Clip Path',
    description: 'The clip-path CSS property creates a clipping region that sets what part of an element should be shown. Parts that are inside the region are shown, while those outside are hidden.',
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
