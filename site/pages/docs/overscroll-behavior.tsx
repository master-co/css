import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import ImageList from '~/components/Css/ImageList'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function OverscrollBehavior() {

    return (
        <>
            <ClassTable names={[
                   ['overscroll-behavior:`value`'],
                   ['overscroll-behavior-x:`value`'],
                   ['overscroll-behavior-y:`value`'],
                   ['overscroll-behavior:auto'],
                   ['overscroll-behavior:contain'],
                   ['overscroll-behavior:none'],
                   ['overscroll-behavior-x:auto'],
                   ['overscroll-behavior-y:auto'],
                   ['overscroll-behavior-x:contain'],
                   ['overscroll-behavior-y:contain'],
                   ['overscroll-behavior-x:none'],
                   ['overscroll-behavior-y:none'],
            ]}>
            </ClassTable>
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>overscroll-behavior</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets what a browser does when reaching the boundary of a scrolling area. 
                It&#39;s a shorthand for <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior-x" target="blank"><code>overscroll-behavior-x</code></a>&nbsp; 
                and <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior-y" target="blank"><code>overscroll-behavior-y</code></a>.
            </p>
            <ImageList
                imageClass="
                    aspect:1/1 w:full h:300 mt:15 overflow:auto scrollbar
                    bg:url('/images/circle.svg')|center|center/50%|50%|no-repeat,url('/images/wallpaper.jpg')|left|top/cover"
                showClasses={
                    [
                        'overscroll-behavior:auto',
                        'overscroll-behavior:contain',
                        'overscroll-behavior:none'
                    ]}
            >
                <p className="f:32 f:heavy f:white! pt:25 h:300">Master</p>
            </ImageList>
            <StyleScrollbarExtend></StyleScrollbarExtend> 
            <StyleFunctions name="overscroll-behavior:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="overscroll-behavior:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="overscroll-behavior:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="overscroll-behavior:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="overscroll-behavior:auto@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.overscroll-behavior'

OverscrollBehavior.page = {
    layout: CssDoc,
    title: 'Overscroll Behavior',
    description: 'The overscroll-behavior CSS property sets what a browser does when reaching the boundary of a scrolling area. It\'s a shorthand for overscroll-behavior-x  and overscroll-behavior-y.',
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
