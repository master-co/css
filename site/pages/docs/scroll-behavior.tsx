import ClassTable from '~/components/Css/ClassTable'
import StyleColorSchemes from '~/components/Css/StyleColorSchemes'
import StyleFunctions from '~/components/Css/StyleFunctions'
import StyleMediaQueries from '~/components/Css/StyleMediaQueries'
import StyleResponsiveBreakpoints from '~/components/Css/StyleResponsiveBreakpoints'
import StyleSelectors from '~/components/Css/StyleSelectors'
import CssDoc from '~/layouts/CssDoc'
import StyleScrollbarExtend from '~/components/Css/StyleScrollbarExtend'
import { Fragment } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function ScrollBehavior() {

    return (
        <>
            <ClassTable names={[
                   ['scroll-behavior:`value`'],
                   ['scroll-behavior:auto'],
                   ['scroll-behavior:smooth']
            ]}>
            </ClassTable>
            
            <h2 id="overview">Overview</h2>
            <p>
                The <strong><code>scroll-behavior</code></strong>&nbsp;
                <a href="https://developer.mozilla.org/en-US/docs/Web/CSS" target="blank">CSS</a> property
                sets the behavior for a scrolling box when scrolling is triggered by the navigation or CSSOM scrolling APIs.
            </p>

            <div className='demo grid-cols:2 gap:12'>
                {
                     [
                        'scroll-behavior:smooth',
                        'scroll-behavior:auto'
                    ].map((className:string)=> {
                        return (
                            <Fragment key={className}>
                                <code className="t:center">{className}</code>
                                <div className={className +" aspect:1/1 w:300 h:300 mt:15 overflow:auto scrollbar t:center>div>p t:none>div>p>a bg:url('/images/circle.svg')|center|center/50%|50%|no-repeat,url('/images/wallpaper.jpg')|left|top/cover"}>
                                    <div id={className+"-top"} className="h:300">
                                        <p className="f:32 t:center pt:25">
                                            <a href={`#${className}-bottom`} 
                                                onClick={(e)=> {
                                                    e.preventDefault()
                                                    const element= document.getElementById(className+'-bottom');
                                                    element?.scrollIntoView({
                                                        block: 'nearest',
                                                        behavior: className.includes('smooth') ?'smooth' : 'auto'
                                                    })
                                                }}>Click Me</a>
                                        </p>
                                    </div>
                                    <div id={className+"-bottom"} className="h:300">
                                        <p className="f:32 f:heavy f:white! pt:25">
                                            <a href={`#${className}-top`}
                                            onClick={(e)=> {
                                                e.preventDefault()
                                                const element= document.getElementById(className+'-top');
                                                element?.scrollIntoView({
                                                    block: 'nearest',
                                                    behavior: className.includes('smooth') ?'smooth' : 'auto'
                                                })
                                            }}>
                                                Back to Top
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </Fragment>
                        )
                    })
                }
            </div>
           
            <StyleScrollbarExtend></StyleScrollbarExtend> 
            <StyleFunctions name="scroll-behavior:$(value)"></StyleFunctions>
            <h2 id="conditionally-apply">Conditionally apply</h2>
            <StyleSelectors name="scroll-behavior:auto:hover"></StyleSelectors>
            <StyleResponsiveBreakpoints name="scroll-behavior:auto@sm"></StyleResponsiveBreakpoints>
            <StyleMediaQueries name="scroll-behavior:auto@print"></StyleMediaQueries>
            <StyleColorSchemes name="scroll-behavior:auto@dark"></StyleColorSchemes>

        </>
    )
}
const localeNamespace = 'docs.css.scroll-behavior'

ScrollBehavior.page = {
    layout: CssDoc,
    title: 'Scroll Behavior',
    description: 'The scroll-behavior CSS property sets the behavior for a scrolling box when scrolling is triggered by the navigation or CSSOM scrolling APIs.',
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